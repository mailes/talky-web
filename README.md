# Talky Web

**Your conversations, in your browser.**

[Website](https://talkytalky.im/?utm_source=github&utm_medium=readme&utm_campaign=talky_web) · [Web app](https://web.talkytalky.im/) · [简体中文](README.zh-CN.md) · [iOS](https://github.com/mailes/talky-ios) · [Android](https://github.com/mailes/talky-android) · [Desktop](https://github.com/mailes/talky-desktop)

Talky Web is the browser client for Talky, built with TypeScript, Solid.js, and MTProto. Features and availability depend on the connected service.

## Development

Use Node.js 22.22 or newer and pnpm 9.15.3.

```sh
git clone https://github.com/mailes/talky-web.git
cd talky-web
git submodule update --init
pnpm install --frozen-lockfile
cp .env.local.example .env.local
# Edit .env.local with your own API ID, API hash, and service endpoint.
pnpm start
```

The development server uses localhost port 8080. See [Building and configuration](docs/BUILDING.md) for production output and deployment requirements.

## Configuration and security

Production credentials and previous compiled deployment assets are excluded. Only non-sensitive build defaults are committed. Keep local configuration and deployment credentials out of Git.

**Every `VITE_*` value used by the client can be included in browser JavaScript.** Git ignore rules do not make frontend configuration secret. Never put server passwords, signing private keys, or privileged service tokens in frontend environment variables. API IDs/hashes and public Web Push keys are client configuration, not server authorization secrets.

## Contributing

Open an issue with reproduction steps or submit a focused pull request. Remove personal information from logs and screenshots. Report vulnerabilities privately using [GitHub private vulnerability reporting](https://github.com/mailes/talky-web/security/advisories/new).

## License

GPL-3.0-only; see [LICENSE](LICENSE) and [NOTICE.md](NOTICE.md). Preserve upstream and dependency license notices. This is an independent project, not an official Telegram client.
