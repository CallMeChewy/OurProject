# Operational Scripts

This package collects command-line tooling that supports release engineering and token lifecycle tasks. Each script currently outlines the expected functionality; implementors should replace the placeholders with production logic once credentials and infrastructure are ready.

## Available Commands

- `npm run package-release --workspace scripts`
  - Packages the SQLite snapshot and assets, uploads them to Google Drive via a service account, computes checksums, and updates the manifest.
- `npm run manage-tokens --workspace scripts`
  - Creates, revokes, and audits distribution tokens stored in Firestore.

## Implementation Notes

- Load secrets via environment variables or `.env` files ignored by git.
- Prefer the Firebase Admin SDK for token management and Google Drive API for uploads.
- Add unit tests alongside the scripts once they move beyond placeholders.

Document any new flags or environment variables inside this README and cross-reference the relevant runbooks in `docs/`.
