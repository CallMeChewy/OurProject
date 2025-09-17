# Zero-Budget Deployment Plan for OurLibrary

## 1. Objectives and Constraints

- **Mission**: Deliver a reliable desktop library with offline-first access while cultivating a community that can eventually fund operations.
- **Budget**: No paid infrastructure beyond the existing 2 TB Google Drive allotment, a basic website (email + static hosting), and free tiers of Google/Firebase services.
- **Audience**: Up to ~100 concurrent early users on low-cost Chromebooks and intermittent connectivity; solution must degrade gracefully when offline.
- **Primary Risks Identified**: exposed OAuth secrets in shipped binaries, fragile multi-account Google rotation, duplicated installer/runtime code, and brittle update flows.

## 2. Guiding Principles

1. **Eliminate embedded secrets**: all distributed binaries/config archives must avoid hard-coded client secrets or account rosters.
2. **Protect distribution endpoints**: expose public artefacts only where abuse is unlikely; otherwise require lightweight token validation before granting downloads.
3. **Offline-first UX**: a fresh install should work without the installer or network; updates enhance but are not required for basic usage.
4. **Single source of truth**: share code and configuration between installer and runtime to reduce maintenance and packaging overhead.
5. **Community-first roadmap**: documentation, feedback loops, and contribution pathways are part of the product plan from day one.

## 3. Architecture Overview

### 3.1 Content Distribution

- Package the SQLite catalogue and essential assets into versioned archives (e.g., `OurLibrary-db-vYYYYMMDD.zip`).
- Keep the master archives in a private Google Drive folder owned by a service account; do **not** enable public link sharing.
- Publish a companion `manifest.json` per release containing file IDs, sizes, SHA-256 hashes, entitlement tier (`free`, `premium`), and release notes.
- Mirror `manifest.json` to Firebase Hosting (free tier) to provide low-latency metadata without exposing Drive credentials. Download URLs are generated on demand by the token service (Section 3.3).

### 3.2 Application Packaging

- Ship a single Electron build that contains:
  - Core application code (`src/`): shared by both installer and runtime via an npm workspace or module symlinks.
- A bootstrapper that checks for the external `~/OurLibrary` tree and initializes it when missing using packaged default assets.
- Update service that reads `manifest.json`, compares versions, and pulls archives via short-lived signed URLs issued by the token service.
- Retire the separate installer app; instead, provide a CLI/bootstrap script (Node/Electron) that invokes the shared setup logic.

### 3.3 Access Control, Tokens, and Rate Limiting

- Remove bundled OAuth credentials and the multi-account rotation logic from the client binary.
- Deploy a minimal Firebase Authentication + Callable Cloud Function stack (fits within the free tier) that:
  - Stores hashed distribution tokens and tier metadata (`free`, `sponsor`, `premium`) in Firestore.
  - Validates token submissions from the app (token + device fingerprint + optional user email) and enforces rolling rate limits (per minute/day) using Firestore counters.
  - When access is permitted, uses a privileged service account (kept server-side) to request a Drive file download URL and returns a short-lived signed URL to the client.
  - Logs abuse indicators (excess failures, IP hot spots) for manual review; automatically suspends tokens crossing abuse thresholds.
- Support offline-first behaviour by allowing the client to cache the signed URL for the duration of the lease (e.g., 15 minutes) and queue downloads while the connection is available.
- Issue tokens via curated channels: free-tier tokens preloaded in devices distributed by partners; premium tokens sold/donated via the website. Tokens can be revoked centrally without repackaging the app.

### 3.4 Update Flow

1. On launch, the app fetches `manifest.json` from Firebase Hosting (cache with ETag for low bandwidth).
2. Compare `latest_version` against local metadata stored in `~/OurLibrary/user_data/config.json`.
3. If newer, show release notes and optional download prompt (mandatory flag supported via manifest).
4. Request a signed URL from the token service and download the archive; verify SHA-256 hash before replacing the local DB.
5. Support resumable downloads by storing partial chunks and using HTTP range requests (Drive supports this when `alt=media`).
6. Always keep the previous DB as a fallback to protect offline users.

### 3.5 Telemetry and Logging

- Default to local logging only. Provide an opt-in toggle that syncs anonymized usage stats to Firebase Analytics once the community approves.
- Document exactly what data is collected to build trust.

## 4. Security Hardening

- Publish an open-source repo that excludes secrets. Use `.env` files (ignored in git) for any dev keys.
- During build time, inject any necessary IDs via environment variables or CI secrets—not baked into the repo.
- Provide a `SECURITY.md` explaining how to report vulnerabilities and the current threat model.
- Validate all downloaded assets with checksums/signatures before use.

## 5. Community-Building Roadmap

| Phase                | Focus                     | Activities                                                                                                              |
| -------------------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 0 – Foundations      | Hardening + Documentation | Publish architecture docs, contributor guide, and transparent roadmap.                                                  |
| 1 – Early Adopters   | Trust & Feedback          | Recruit small pilot group via mailing list, collect bug reports, run monthly town-hall calls (via Google Meet).         |
| 2 – Content Curators | Shared Ownership          | Empower volunteers to help package new releases; document curation workflow using Google Sheets + shared Drive.         |
| 3 – Sustainability   | Funding Pathways          | Launch donation campaign (Patreon/OpenCollective) once community demonstrates engagement; explore institutional grants. |

## 6. Implementation Backlog

1. **Refactor codebase** into a monorepo with shared core module; delete duplicated legacy installer logic (formerly `AppSource1`).
2. **Bootstrapper rewrite**: convert existing installer steps (`installer-setup.js`, `database-updater.js`) into library functions invoked by main app on first run.
3. **Token service MVP**: stand up Firebase Auth + Cloud Functions + Firestore rules enforcing token validation, tier metadata, and rate limits; script for generating/revoking tokens.
4. **Manifest publisher script**: Node CLI that packages DB, uploads to Drive (via developer-only credentials), writes manifest + checksum, and registers file IDs with the token service.
5. **Update client**: replace current `updateDatabase` IPC handlers with manifest-driven workflow, signed URL retrieval, and checksum verification.
6. **Credentials purge**: remove `Config/google_credentials.json` and `google_accounts.json` from distribution; add README instructions for maintainers on how to provision secrets locally.
7. **Documentation sprint**: write setup, release, and contribution guides in `/docs` and publish to the static website, including how tokens are issued/limited.
8. **Community tooling**: set up a Google Group or Firebase-powered mailing list, Feedback form (Google Forms), and triage process.

## 7. Risk Mitigation Without Budget

- **Drive quota exhaustion**: rotate archive IDs monthly and distribute via multiple shared folders; encourage community mirrors (USB sticks, torrents) for large cohorts.
- **Offline installs**: provide quarterly full AppImage/zip packages containing the DB so organizations can propagate via sneakernet.
- **Loss of Google services**: maintain an export pipeline to open standards (zip + CSV) so data can be migrated quickly if the platform must move to new hosting.
- **Token leakage/abuse**: monitor Firestore counters for anomalies, rotate signing keys quarterly, and provide a rapid revocation path for leaked tokens.

## 8. Next Steps (90-Day Timeline)

1. Week 1–2: Remove secrets from repo, restructure project layout, and implement bootstrapper fallback.
2. Week 3–4: Implement Firebase-based token service (Auth + Functions + Firestore rules) and secure Drive access via signed URLs.
3. Week 5–6: Build manifest packaging workflow, integrate client-side updater with signed URL retrieval, and add checksum validation.
4. Week 7–8: Publish documentation set (including token issuance policy) and launch early adopter program via mailing list.
5. Week 9–12: Collect feedback, iterate on UX and rate-limit tuning, release first public build, host community forum (Google Group), and plan donation roadmap.

---

Prepared by: Zero-budget architecture advisory
Date: `2025-09-15`
