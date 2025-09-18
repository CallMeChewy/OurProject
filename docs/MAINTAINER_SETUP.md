# Maintainer Setup Guide

This checklist gets a new maintainer from a clean clone to a working developer environment, desktop build, and GitHub Pages registration site.

## 1. Repo Clone & Tooling

```bash
git clone https://github.com/CallMeChewy/OurProject.git
cd OurProject
npm install
npm test       # node --test core/tests/*.test.js
```

## 2. Local Configuration

All runtime secrets stay out of git. Populate the templates in `config/` before launching the desktop app:

```bash
cp config/templates/google_credentials.example.json config/google_credentials.json
cp config/templates/ourlibrary_config.example.json config/ourlibrary_config.json
cp config/templates/ourlibrary_google_config.example.json config/ourlibrary_google_config.json
cp config/templates/ourlibrary_secret.example.json config/ourlibrary_secret.json
```

- `config/manifest.local.json` is tracked and provides the offline bootstrap manifest bundled with the AppImage.
- Keep all real credentials in a secrets manager; never commit populated JSON files.
- `user_data/config.json` (generated on first run) now includes a `distribution_token` field; keep it `null` until you provision a valid token via the CLI or UI.

## 3. Desktop Bootstrap (Offline Friendly)

```bash
npm run start         # Electron dev mode
npm run build         # wraps electron-builder
```

Build output (`app/dist/OurLibrary-<version>.AppImage`) already:
- Reuses the local Electron installation
- Runs with `--no-sandbox` and strips the setuid helper
- Includes `Assets/sql.js` and `config/manifest.local.json`

To smoke test on restrictive systems (no FUSE):

```bash
APPIMAGE_EXTRACT_AND_RUN=1 ./app/dist/OurLibrary-2.0.0.AppImage
```

On normal distros, double-clicking the AppImage is sufficient.

## 4. Registration Website (GitHub Pages)

Site assets live directly under `docs/`:

- `docs/index.html` – landing + registration UI (Firebase placeholders)
- `docs/web-shim.js` – shared shim resolving assets relative to the page
- `docs/Config/ourlibrary_google_config.json` – sanitized defaults for the web flow
- `docs/Assets/sql.js/*` – local sql.js runtime
- `docs/ProjectHimalayaBanner.png` – hero image

Deployment steps:

1. Commit any changes and push `main`.
2. In repository **Settings → Pages**, select **Deploy from branch**, `main`, folder `/docs`.
3. Pages publishes to `https://<username>.github.io/OurProject/` (or your custom domain).
4. Before production, replace the Firebase placeholders in `docs/index.html` and update `docs/Config/ourlibrary_google_config.json` with real values.

## 5. Tests & CI Hooks

- `npm test` runs node-based smoke tests (`core/tests/`).
- Add additional suites under `core/tests/` as bootstrap logic evolves.
- Keep AppImage footprint checks and end-to-end installer scripts in mind for future CI.

## 6. Release Checklist

- [ ] Update `config/manifest.local.json` with the new database metadata.
- [ ] Build AppImage (`npm run build`) and smoke test on target platforms.
- [ ] Update `docs/index.html` if registration messaging changes.
- [ ] Commit changes, `git push`, confirm GitHub Pages deployment succeeded.
- [ ] Tag the release / create GitHub Release as needed.

## 7. Reference Docs

- `docs/00-ProjectCharter.md` – policy & guardrails
- `docs/01-SystemDesign.md` – architecture flows
- `docs/02-DeploymentPlan.md` – zero-budget roadmap
- `docs/03-SequencingPlan.md` – execution phases
- `docs/SECURITY.md` – incident response & secret handling

Keep this document updated as processes evolve.

## Appendix: Token Service CLI

The token management CLI lives under `scripts/` and relies on `firebase-admin`. Install dependencies and set credentials before running:

```bash
npm install --workspace scripts
export FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccount.json
npm run manage-tokens --workspace scripts -- create --tier free --max-downloads 3
```

Supported commands (more detail in `docs/TOKEN_SERVICE_PLAN.md`):

- `create --tier <tier> [--max-downloads <n>] [--expires-in-hours <n>]`
- `revoke <tokenId>`
- `list [--status active]`
- `issue-url <token> <fileId> <version> [--endpoint https://...]` – calls the deployed token service to validate a token and retrieve a signed download URL; uses `OURLIBRARY_TOKEN_ENDPOINT` if set.
