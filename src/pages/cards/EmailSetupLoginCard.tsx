import {createSignal, JSX, onCleanup, onMount} from 'solid-js';

import Button from '@components/buttonTsx';
import {InputFieldTsx} from '@components/inputFieldTsx';
import InputField, {InputState} from '@components/inputField';
import LanguageChangeButton from '@components/languageChangeButton';
import MediaHeader from '@components/mediaHeader';
import cancelEvent from '@helpers/dom/cancelEvent';
import focusWhenConnected from '@helpers/dom/focusWhenConnected';
import replaceContent from '@helpers/dom/replaceContent';
import IS_TOUCH_SUPPORTED from '@environment/touchSupport';
import {i18n, LangPackKey} from '@lib/langPack';

import AuthCard from '@/pages/AuthCard';
import {CardSpec, useAuthFlow} from '@/pages/authFlow';
import styles from '@/pages/authFlow.module.scss';

if(import.meta.hot) import.meta.hot.accept();

type Spec = Extract<CardSpec, {name: 'emailSetupLogin'}>;

/**
 * Phone-initiated sign-up under TELESRV_LOGIN_EMAIL_REQUIRE_SETUP=true.
 * auth.sendCode replied with sentCodeTypeSetUpEmailRequired (no login code
 * exists yet), so this card first binds a login email:
 *
 *   1. account.sendVerifyEmailCode(emailVerifyPurposeLoginSetup) — a code
 *      arrives in the mailbox;
 *   2. account.verifyEmail — the server replies with account.emailVerified
 *      Login, embedding a fresh auth.sentCode for the actual login flow;
 *   3. hand that sentCode to the shared authCode card and continue exactly
 *      like the email-initiated path.
 *
 * Mirrors the desktop CodeWidget::emailVerifyDone hand-off.
 */
export default function EmailSetupLoginCard(props: {spec: Spec}) {
  const {managers, navigate, toIm} = useAuthFlow();

  const {phone, phoneHash} = props.spec.payload;

  /* ---------- state ---------- */

  const [stage, setStage] = createSignal<'email' | 'code'>('email');
  const [email, setEmail] = createSignal('');
  const [emailPattern, setEmailPattern] = createSignal('');
  const [code, setCode] = createSignal('');
  const [submitting, setSubmitting] = createSignal(false);
  const [nextContent, setNextContent] = createSignal<JSX.Element>(i18n('Login.Next'));

  /* ---------- inputs ---------- */

  let emailInputRef: InputField;
  let codeInputRef: InputField;

  const errorLabel = document.createElement('div');
  errorLabel.classList.add(styles.errorLabel);

  function refForStage(): InputField | undefined {
    return stage() === 'email' ? emailInputRef : codeInputRef;
  }

  function showErrorKey(key: LangPackKey) {
    const inputRef = refForStage();
    if(!inputRef) return;
    inputRef.setState(InputState.Error);
    replaceContent(errorLabel, i18n(key));
  }

  function showErrorText(text: string) {
    const inputRef = refForStage();
    if(!inputRef) return;
    inputRef.setState(InputState.Error);
    errorLabel.textContent = text;
  }

  function clearError() {
    replaceContent(errorLabel, '');
  }

  /* ---------- stage 1: bind email ---------- */

  async function submitEmail(e?: Event) {
    if(e) cancelEvent(e);

    const value = email().trim();
    if(!value || !value.includes('@')) {
      showErrorKey('Login.SignEmail.Invalid');
      return;
    }

    setSubmitting(true);
    setNextContent(
      <>
        {i18n('PleaseWait')}
        <svg xmlns="http://www.w3.org/2000/svg" class="preloader-circular" viewBox="25 25 50 50">
          <circle class="preloader-path" cx="50" cy="50" r="20" fill="none" stroke-miterlimit="10"/>
        </svg>
      </>
    );

    try {
      const sent = await managers.apiManager.invokeApi('account.sendVerifyEmailCode', {
        purpose: {
          _: 'emailVerifyPurposeLoginSetup',
          phone_number: phone,
          phone_code_hash: phoneHash
        },
        email: value
      });
      setEmailPattern(sent.email_pattern || value);
      setStage('code');
      clearError();
      setNextContent(i18n('Login.Next'));
      if(codeInputRef) {
        codeInputRef.input.focus();
      }
    } catch(err: any) {
      setNextContent(i18n('Login.Next'));
      switch(err.type) {
        case 'EMAIL_INVALID':
          showErrorKey('Login.SignEmail.Invalid');
          break;
        case 'EMAIL_NOT_ALLOWED':
          showErrorKey('Login.SignEmail.Taken');
          break;
        default:
          console.error('sendVerifyEmailCode error:', err);
          showErrorText(err.type || 'Unknown error');
          break;
      }
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------- stage 2: verify code, receive the login sentCode ---------- */

  async function submitCode(e?: Event) {
    if(e) cancelEvent(e);

    const value = code().trim();
    if(!value) {
      return;
    }

    setSubmitting(true);
    try {
      const verified = await managers.apiManager.invokeApi('account.verifyEmail', {
        purpose: {
          _: 'emailVerifyPurposeLoginSetup',
          phone_number: phone,
          phone_code_hash: phoneHash
        },
        verification: {
          _: 'emailVerificationCode',
          code: value
        }
      });

      if(verified._ === 'account.emailVerifiedLogin') {
        const sentCode = verified.sent_code;
        // The server hands back a fresh auth.sentCode for the login itself —
        // continue on the shared authCode card (same flow as the
        // email-initiated path from here on).
        navigate({
          name: 'authCode',
          payload: Object.assign(sentCode as any, {phone_number: phone})
        });
        return;
      }
      // account.emailVerified (non-login purposes) is not expected here.
      showErrorText('Unexpected verify response: ' + verified._);
      setSubmitting(false);
    } catch(err: any) {
      setSubmitting(false);
      switch(err.type) {
        case 'CODE_INVALID':
        case 'PHONE_CODE_INVALID':
          showErrorKey('PHONE_CODE_INVALID');
          break;
        case 'CODE_EXPIRED':
        case 'PHONE_CODE_EXPIRED':
          showErrorKey('PHONE_CODE_EXPIRED');
          break;
        default:
          console.error('verifyEmail error:', err);
          showErrorText(err.type || 'Unknown error');
          break;
      }
    }
  }

  /* ---------- lifecycle ---------- */

  let cancelFocus: (() => void) | undefined;
  onMount(() => {
    if(!IS_TOUCH_SUPPORTED) {
      cancelFocus = focusWhenConnected(emailInputRef.input);
    }
  });

  onCleanup(() => {
    cancelFocus?.();
  });

  return (
    <AuthCard
      class={styles.pageSignIn}
      header={
        <MediaHeader>
          <MediaHeader.Title>{i18n('Login.SignEmail.SetupTitle')}</MediaHeader.Title>
          <MediaHeader.Subtitle class="secondary">
            {stage() === 'email' ?
              i18n('Login.SignEmail.Subtitle') :
              i18n('Login.Code.SentEmail', [emailPattern()])}
          </MediaHeader.Subtitle>
        </MediaHeader>
      }
      inputWrapper={false}
    >
      {stage() === 'email' ? (
        <div class="input-wrapper">
          <InputFieldTsx
            instanceRef={(ref: InputField) => emailInputRef = ref}
            label="Login.SignEmail.InputCaption"
            disabled={submitting()}
            value={email()}
            onRawInput={(val: string) => {
              setEmail(val);
              clearError();
              emailInputRef.setState(InputState.Neutral);
            }}
          />
          {errorLabel}
          <Button
            class="btn-primary btn-color-primary"
            disabled={submitting() || !email().includes('@')}
            onClick={submitEmail}
          >
            {nextContent()}
          </Button>
          <LanguageChangeButton />
        </div>
      ) : (
        <div class="input-wrapper">
          <InputFieldTsx
            instanceRef={(ref: InputField) => codeInputRef = ref}
            label="Login.SignEmail.CodeCaption"
            disabled={submitting()}
            value={code()}
            onRawInput={(val: string) => {
              setCode(val);
              clearError();
              codeInputRef.setState(InputState.Neutral);
            }}
          />
          {errorLabel}
          <Button
            class="btn-primary btn-color-primary"
            disabled={submitting() || !code()}
            onClick={submitCode}
          >
            {nextContent()}
          </Button>
        </div>
      )}
    </AuthCard>
  );
}
