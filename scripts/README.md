# Operational Scripts

This package collects command-line tooling that supports release engineering and token lifecycle tasks. The utilities rely on environment configuration for secrets and integrate with the shared token service modules.

## Available Commands

- `npm run package-release --workspace scripts`
  - Zips the SQLite snapshot (and optional assets), computes SHA-256, writes release metadata, and updates the manifest. Provide `--file-id <driveId>` once the archive is uploaded so the manifest/metadata include the Drive reference. Uploading to Drive and Firestore registration remain manual steps noted in the CLI output.
- `npm run manage-tokens --workspace scripts`
  - Creates, revokes, and audits distribution tokens stored in Firestore.

## Implementation Notes

- Load secrets via environment variables or `.env` files ignored by git.
- `manage-tokens` requires Firebase Admin credentials (`FIREBASE_SERVICE_ACCOUNT_PATH`) and a configured token service endpoint.
- `package-release` shells out to `python3` for archive creation; ensure it is available on the host. Drive uploads and Firestore updates must be performed manually after the script runs.

Document any new flags or environment variables inside this README and cross-reference the relevant runbooks in `docs/`.
