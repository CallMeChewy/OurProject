# @ourlibrary/core

Shared Node modules consumed by the Electron runtime and automation scripts.

## Modules

- `bootstrap.js` – provisions the `~/OurLibrary` filesystem, checks manifest metadata, downloads new SQLite snapshots, and updates configuration files.
- `tokenService.js` – client helper for authenticating with Firebase and requesting signed download URLs (works with the `issueDownloadUrl` Cloud Function).
- `index.js` – entry point exporting the available modules for consumers (`const { Bootstrap } = require('@ourlibrary/core');`).

## Configuration

- Override the manifest URL with `OURLIBRARY_MANIFEST_URL` or pass `{ manifestUrl }` to the `Bootstrap` constructor.
- Supply Firebase credentials via environment variables (`OURLIBRARY_FIREBASE_*`) or inject a custom config object before initializing the token service.
- Add extra search paths for `sql.js` WASM assets by passing `{ sqlJsAssetRoots: ['/custom/path'] }` to the constructor.

## Publishing

This package is marked `private` and is intended for use through npm workspaces inside this repository. Do not publish it to a public registry.
