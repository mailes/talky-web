# Building and configuration

Use Node.js 22.22+ and pnpm 9.15.3. Install with `pnpm install --frozen-lockfile` after `git submodule update --init`. The `src/solid` and `src/opus-recorder` submodules retain their public upstream revisions; the application uses the checked-in Solid fork under `src/vendor/solid` by default.

Copy `.env.local.example` to `.env.local`. Set your own `VITE_API_ID` and 32-character hexadecimal `VITE_API_HASH`; see https://core.telegram.org/api/obtaining_api_id. The build and dev server reject missing or placeholder API settings. Set `VITE_TELESRV_DC_HOST`, `VITE_TELESRV_DC_PORT`, and `VITE_TELESRV_WS_PATH` for a self-hosted MTProto service. Use HTTPS/WSS for a public deployment. A local endpoint example does not deploy a backend.

The optional `VITE_PUSH_SERVER_KEY` is a public Web Push application-server key; never supply its private counterpart to the client. All client environment values can be inspected by users. Keep privileged operations and credentials on the server.

```sh
pnpm start                 # development, localhost:8080
pnpm build                 # production build, dist/
pnpm exec vitest run       # unit tests, exits after completion
```

Production assets are generated into ignored `dist/`. The Vite build intentionally does not copy the public directory automatically: deploy the retained static contents of `public/` together with `dist/` output, with the fresh `dist/` files taking precedence. Serve through HTTPS with the worker/security headers required by your deployment. Test authentication, messages, media, and calls against your own service before publishing.

`build.js` is a legacy packaging/deployment helper and can invoke remote deployment when supplied local SSH settings. Use `pnpm build` for a local build. No deployment or remote upload is required to build this repository. Do not commit `ssh.json`, sessions, certificates, or `.env.local`.

The first public source export removes old generated bundles and maps from `public/`. The standalone recorder and rlottie runtime files, public protocol keys, and deterministic encryption test vectors remain because the client and tests require them.

The application build uses the bundled codec runtimes. Rebuilding opus-recorder itself also requires its nested upstream repositories; recursive initialization was not verified because the upstream GitLab clone did not finish during this export. Top-level pinned submodules were initialized successfully.
