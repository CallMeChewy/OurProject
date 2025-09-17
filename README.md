# OurLibrary Monorepo

This repository hosts the clean-room implementation of the OurLibrary desktop experience, installer bootstrap, backend automation scripts, and supporting documentation. It is designed to be the single source of truth for future contributors.

## Directory Layout

- `app/` – Electron desktop runtime (renderer + main process).
- `core/` – Shared Node modules (bootstrapper, token service).
- `config/` – Redacted configuration templates. Copy and populate locally.
- `docs/` – Project charter, design specs, deployment/runbooks, and agent guides.
- `scripts/` – Operational CLI tooling (release packaging, token management).
- `services/` – External service integrations (e.g., legacy Google Apps Script).

## Getting Started

```bash
npm install
npm run start            # Launch the Electron app in development mode
APPIMAGE_EXTRACT_AND_RUN=1 npm run build  # Build offline-friendly AppImage
```

The build script wraps `electron-builder` to:

- Reuse the locally installed Electron distribution (no network fetches).
- Provide a 7zip shim so packaging succeeds on minimal systems.
- Strip the privileged `chrome-sandbox` helper and launch with `--no-sandbox`.
- Ship the fallback manifest and sql.js WebAssembly assets outside the asar so bootstrap can run offline.

After building, inspect the bundle under `app/dist/`:

- `OurLibrary-<version>.AppImage` – distributable package.
- `linux-unpacked/` – unpacked directory for debugging.
- `builder-debug.yml` – effective electron-builder config for audit trails.

To smoke test in restricted environments that block FUSE, run the AppImage with extraction mode:

```bash
APPIMAGE_EXTRACT_AND_RUN=1 ./app/dist/OurLibrary-2.0.0.AppImage
```

Before launching the app, create the necessary configuration files:

```bash
cp config/templates/google_credentials.example.json config/google_credentials.json
cp config/templates/ourlibrary_secret.example.json config/ourlibrary_secret.json
```

Populate each file with environment-specific values from your secrets manager. Additional templates are documented in `config/README.md`.

## Release Automation

The `scripts/` package contains placeholder CLIs for packaging releases and managing distribution tokens. Extend these Node scripts to integrate with Firebase and Google Drive once credentials are provisioned.

```bash
npm run package-release   # TODO: implement release automation
npm run manage-tokens     # TODO: implement token lifecycle operations
```

## Documentation

Authoritative guidance lives under `docs/`:

- `00-ProjectCharter.md` – mandatory best practices and guardrails.
- `01-SystemDesign.md` – consolidated architecture and data flows.
- `02-DeploymentPlan.md` – zero-budget deployment roadmap.
- `03-SequencingPlan.md` – phased engineering plan with service dependencies.

Additional setup notes are in `docs/SETUP_GOOGLE_SHEETS.md` and `docs/DEPLOY_APPS_SCRIPT.md`.

## Registration Website (GitHub Pages)

A trimmed, static registration experience lives in `docs/website/`. The bundle includes:

- `index.html` – landing page + registration modal with Firebase hooks (API keys are placeholders).
- `web-shim.js` – shares the same shim used by the desktop app; automatically resolves assets relative to the page location.
- `Config/ourlibrary_google_config.json` – sanitized offline defaults (update with real values before launch).
- `Assets/sql.js/*` – local sql.js runtime so the page works without external CDNs.

To publish it via GitHub Pages:

1. Push `main` to GitHub.
2. In **Repository Settings → Pages**, choose **Deploy from branch**, pick `main`, and set the folder to `/docs`.
3. After deployment, the registration page will be available at `https://<username>.github.io/OurProject/website/` (or at the configured custom domain). Update DNS/CNAME as needed.
4. Replace the Firebase placeholders in `docs/website/index.html` with production credentials stored in your secrets manager.

## Contributing

1. Fork the repository and create feature branches off `main`.
2. Follow the charter’s Definition of Done: tests, docs, runbooks, staging validation.
3. Submit pull requests with security/cost impact notes and manual test evidence.
4. Rotate secrets immediately if accidental exposure occurs.

By centralizing code and knowledge here, the team can iterate safely, control costs, and deliver an excellent user experience that inspires the community to fund future improvements.
