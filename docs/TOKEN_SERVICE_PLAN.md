# Token Service MVP Plan

Derived from `docs/02-DeploymentPlan.md` and `docs/03-SequencingPlan.md`. This document breaks the Phase 2 work into concrete tasks.

## 1. Infrastructure

- **Firebase Project Configuration**
  - Enable Authentication (Google OAuth provider only).
  - Enable Cloud Functions (2nd gen) and Firestore in native mode.
  - Create Firestore collections:
    - `tokens/{tokenId}` with fields: `tier`, `status`, `issuedAt`, `expiresAt`, `usageCount`, `maxDownloads`.
    - `archives/{version}` with fields: `fileId`, `sha256`, `sizeBytes`, `tier`.

- **Service Account / Drive Access**
  - Provision a Google Drive service account with access to the archive folder.
  - Store Drive credentials in Firebase Functions config (`firebase functions:config:set drive.client_id=...`).

## 2. Cloud Functions

- **issueDownloadUrl(tokenId, version)**
  - Verifies token exists, is active, and tier permits the requested archive.
  - Checks quota (`usageCount < maxDownloads`).
  - Retrieves Drive `fileId` from `archives/{version}`.
  - Calls Drive API to create a short-lived download URL.
  - Increments usage counter and logs audit record (`downloads/{doc}`).

- **revokeToken(tokenId)**
  - Sets `status = 'revoked'` and records `revokedAt` timestamp.

- **rotateArchives(version)**
  - Updates `archives/{version}` metadata when the manifest publisher uploads a new DB.

- **scheduled cleanup** (optional)
  - Disables expired tokens and purges logs past retention window.

## 3. Firestore Rules

- Permit read/write only through Cloud Functions service account.
- Block direct client access to `tokens` and `archives` collections.
- Allow Cloud Functions to update usage counters atomically.

## 4. Scripts / Tooling

- Extend `scripts/manage-tokens.js`:
  - `create-token --tier free --max-downloads 3`
  - `revoke-token --id TOKEN_ID`
  - `list-tokens`
  - CLI should call Functions via Firebase Admin SDK.

- Extend `scripts/package-release.js`:
  - After uploading new DB to Drive, record metadata in Firestore (`archives/{version}`).

## 5. Desktop Integration

- Update bootstrap download flow:
  - Request signed URL via token service (`issueDownloadUrl`).
  - Download archive, verify SHA-256, then replace local DB.
  - Handle error states: quota exceeded, token invalid, tier mismatch.

- Persist token information locally (`config.json` or secured storage) and offer CLI/UI to refresh tokens.

## 6. Security & Monitoring

- Store all secrets in Firebase config or secrets manager; never in repo.
- Enable Firebase logging for function invocations; add alerts on abnormal failure rates.
- Consider daily audit job to check Firestore token usage.

## 7. Milestones (from Sequencing Plan)

1. **Week 3–4** – Implement Firebase Auth, Functions, Firestore rules, and Drive integration.
2. **Week 5–6** – Integrate publisher + desktop client with token service; add checksum verification.

## 8. Desktop Download Roadmap

- Expose a secure location to persist the user token (e.g., encrypted config or OS keychain).
- Extend IPC (`download-file`) to request a signed URL via the token service before invoking `downloadDatabase`.
- Surface quota/expiry errors to the renderer with actionable messaging.
- Add smoke tests that stub the token service response and confirm downloads write SHA-validated databases.

Keep this document updated as implementation progresses.
