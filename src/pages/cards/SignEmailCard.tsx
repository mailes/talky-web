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
import App from '@config/app';
import {i18n, LangPackKey} from '@lib/langPack';

import AuthCard from '@/pages/AuthCard';
import {CardSpec, useAuthFlow} from '@/pages/authFlow';
import styles from '@/pages/authFlow.module.scss';
if(import.meta.hot) import.meta.hot.accept();

type Spec = Extract<CardSpec, {name: 'signEmail'}>;

/**
 * Card variant of the email-initiated login flow. The user enters their login
 * email; `auth.sendCode` is called with the email in the `phone_number` field
 * (the server identifies the email path by the '@', looks up the bound account
 * and delivers the code to that mailbox). The response is an
 * `auth.sentCode` with `sentCodeTypeEmailCode` and is forwarded to the shared
 * `authCode` card with the email carried in `phone_number` — `auth.signIn` has
 * no dedicated email field either, and the server keys off the same marker.
 * Future OAuth buttons (Google/GitHub) belong in this card's footer.
 */
export default function SignEmailCard(_props: {spec: Spec}) {
  const {managers, navigate, toIm} = useAuthFlow();

  /* ---------- state ---------- */

  const [email, setEmail] = createSignal('');
  const [submitting, setSubmitting] = createSignal(false);
  const [error, setError] = createSignal<string | undefined>();
  const [nextContent, setNextContent] = createSignal<JSX.Element>(i18n('Login.Next'));

  /* ---------- input ---------- */

  let inputRef: InputField;

  function onInput(val: string) {
    setEmail(val);
    setError(undefined);
    replaceContent(errorLabel, '');
    inputRef.setState(InputState.Neutral);
  }

  const errorLabel = document.createElement('div');
  errorLabel.classList.add(styles.errorLabel);

  function showErrorKey(key: LangPackKey) {
    setError(key);
    inputRef.setState(InputState.Error);
    replaceContent(errorLabel, i18n(key));
  }

  function showErrorText(text: string) {
    setError(text);
    inputRef.setState(InputState.Error);
    errorLabel.textContent = text;
  }

  /* ---------- submit ---------- */

  async function onSubmit(e?: Event) {
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

    managers.apiManager.invokeApi('auth.sendCode', {
      // The email rides in `phone_number`: the server keys off the '@' and
      // looks up the account bound to this login email (see SendCodeByEmail).
      phone_number: value,
      api_id: App.id,
      api_hash: App.hash,
      settings: {
        _: 'codeSettings',
        pFlags: {}
      }
    }).then(async(code) => {
      if(code._ === 'auth.sentCodeSuccess') {
        const {authorization} = code;
        if(authorization._ === 'auth.authorization') {
          await managers.apiManager.setUser(authorization.user);
          toIm();
          return;
        }
      }

      navigate({
        name: 'authCode',
        // The email is carried as `phone_number` — the authCode card feeds the
        // same field back into auth.signIn, where the server matches it
        // against the email recorded in the phone_code_hash entry.
        payload: Object.assign(code as any, {phone_number: value})
      });
    }).catch((err) => {
      setSubmitting(false);
      setNextContent(i18n('Login.Next'));

      switch(err.type) {
        case 'EMAIL_UNREGISTERED':
          showErrorKey('Login.SignEmail.Unknown');
          break;
        case 'EMAIL_LOGIN_DISABLED':
          showErrorKey('Login.SignEmail.Disabled');
          break;
        case 'PHONE_NUMBER_FLOOD':
          showErrorKey('Error.AnError');
          break;
        default:
          console.error('auth.sendCode(email) error:', err);
          showErrorText(err.type || 'Unknown error');
          break;
      }
    });
  }

  /* ---------- lifecycle ---------- */

  let cancelFocus: (() => void) | undefined;
  onMount(() => {
    if(!IS_TOUCH_SUPPORTED && inputRef) {
      cancelFocus = focusWhenConnected(inputRef.input);
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
          <MediaHeader.Title>{i18n('Login.SignEmail.Title')}</MediaHeader.Title>
          <MediaHeader.Subtitle class="secondary">{i18n('Login.SignEmail.Subtitle')}</MediaHeader.Subtitle>
        </MediaHeader>
      }
      inputWrapper={false}
    >
      <div class="input-wrapper">
        <InputFieldTsx
          instanceRef={(ref) => inputRef = ref}
          label="Login.SignEmail.InputCaption"
          disabled={submitting()}
          value={email()}
          errorLabel={error() ? null : undefined}
          onRawInput={onInput}
        />
        {errorLabel}
        <Button
          class="btn-primary btn-color-primary"
          disabled={submitting() || !email().includes('@')}
          onClick={onSubmit}
        >
          {nextContent()}
        </Button>
        <LanguageChangeButton />
      </div>
      <Button
        class="btn-primary btn-secondary btn-primary-transparent primary"
        disabled={submitting()}
        onClick={() => navigate({name: 'signIn'})}
        text="Login.SignEmail.BackToPhone"
      />
    </AuthCard>
  );
}
