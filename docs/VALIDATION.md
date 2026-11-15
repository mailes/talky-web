# Public export validation — 2026-11-15

- Production build (`pnpm build`): passed on macOS with local API configuration; output is ignored and is not published in Git.
- Missing API configuration: Vite rejects the build with an actionable error.
- Unit suite: 352 passed, 31 skipped, 1 failed. The failed `appGroupCallsManagerJoin` expectation also fails with the original Vite configuration. One sanitized run additionally reported an asynchronous crypto test error; it was not reproduced in the original-configuration rerun. The suite is not fully green.
- Public staged source: Gitleaks passes with narrow documented allowlists for upstream deterministic crypto test vectors and UI/config identifiers.
- Both submodule repositories and pinned commits were verified publicly accessible.
- End-to-end sign-in, messaging, and calls against a production server were not tested in this export. No server or website deployment was performed.

Build warnings include static font paths resolved at runtime, an outdated Browserslist dataset, and large chunks. The build succeeds; deploy retained public static assets alongside fresh dist output as documented in BUILDING.md.
