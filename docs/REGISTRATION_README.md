# Registration Website Snapshot

The `docs/` directory contains the static assets served by GitHub Pages for the OurLibrary registration experience.

- `docs/index.html` reproduces the public landing + registration flow with Firebase hooks.
- `docs/web-shim.js` is shared with the desktop app and resolves assets relative to the page URL.
- `docs/Config/ourlibrary_google_config.json` ships with placeholder values—replace with real configuration before enabling the site.
- `docs/Assets/sql.js/` provides the local sql.js runtime to keep the page self-contained.

When deploying, update the environment-specific Firebase configuration and point GitHub Pages to the `/docs` directory.
