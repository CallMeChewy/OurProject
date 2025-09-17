# OurLibrary Development & Service Sequencing Plan

## Overview

Goal: deliver a secure, token-controlled distribution workflow and unified desktop app capable of serving ~100 low-bandwidth users without paid infrastructure. This plan sequences engineering tasks alongside required service configurations.

## Phase 0 – Preparation (Week 0)

### Development Tasks

- Audit repository for hard-coded secrets; add `.env.example` and gitignore rules.
- Establish monorepo structure (`/app`, `/core`, `/scripts`) and migrate shared modules out of the legacy installer tree (`AppSource1`).
- Set up local environment documentation (Node version, npm scripts, lint/test commands).

### Service Actions

- Create Firebase project (if not already): enable Authentication, Firestore, Cloud Functions, Hosting.
- Restrict Google Cloud Console access to core maintainers; generate service account with Drive read access (no keys distributed yet).

## Phase 1 – Core Refactor & Bootstrapper (Weeks 1–2)

### Development Tasks

- Merge installer logic (`installer-setup.js`, `database-updater.js`) into shared `core/bootstrap` module consumed by the main Electron process.
- Implement runtime bootstrapper that initializes `~/OurLibrary` when missing and seeds minimal config.
- Replace direct sqlite initialization with dependency-injected path resolver for easier testing.
- Write unit tests for bootstrapper and filesystem creation logic (use tmp directories).

### Service Actions

- None beyond Firebase project creation.

## Phase 2 – Token Service MVP (Weeks 3–4)

### Development Tasks

- Design token schema: `{ tokenHash, tier, maxDailyDownloads, maxMonthlyDownloads, status, issuedTo, issuedBy }`.
- Implement Firebase Cloud Function (`issueDownloadUrl`) that:
  1. Validates Firebase Auth user or anonymous token payload including distribution token.
  2. Checks Firestore counters (`usage/{token}/YYYY-MM-DD`) for rate limits.
  3. Requests Drive file download URL via service account and returns signed URL + expiry.
- Build admin script (`scripts/manage-tokens.js`) to create/revoke tokens and output printable cards/CSV.
- Add client-side `tokenService` module to call the Cloud Function and cache signed URLs.
- Integrate tier awareness into renderer (free vs premium collections).

### Service Actions

- Configure Firebase Authentication: enable Email/Password and Anonymous providers (anonymous gated by token entry flow).
- Set Firestore security rules to restrict read/write to Cloud Functions for usage counters; tokens collection read-only to privileged roles.
- Deploy initial Cloud Function and define environment variables (Drive folder IDs, signing secret lifespan).
- Create Google service account with Drive read scope; store JSON key in Firebase Functions config via `firebase functions:config:set` (not in repo).

## Phase 3 – Manifest Workflow & Updater (Weeks 5–6)

### Development Tasks

- Author packaging CLI (`scripts/package-release.js`) to:
  1. Export SQLite DB + assets into zip.
  2. Upload to Drive using service account credentials.
  3. Compute SHA-256 hash and update `manifest.json` with file metadata and tier.
  4. Register file ID with Firestore (`files/{version}`) for token service lookup.
- Update Electron app to fetch manifest from Firebase Hosting/Firestore, compare versions, request signed URL, and download with resume + checksum verification.
- Ensure rollback to previous DB on download failure.
- Add automated tests for manifest parsing and checksum verification.

### Service Actions

- Deploy Firebase Hosting site or static bucket for `manifest.json` (optionally use Hosting rewrites to proxy Firestore doc).
- Seed Firestore `files` collection with initial release metadata.
- Set Cloud Function environment for manifest location.

## Phase 4 – UX & Documentation (Weeks 7–8)

### Development Tasks

- Implement token entry UI flow (first-launch modal, status indicators, error handling for rate limit hits).
- Enhance offline messaging: show cached books, sync queues, and retry prompts.
- Draft comprehensive docs: setup guide, token issuance policy, troubleshooting, community onboarding.
- Create automated build pipeline (GitHub Actions) producing unsigned artifacts for testing.

### Service Actions

- Configure Firebase Hosting to serve docs or integrate with existing static website.
- Set up Firebase Analytics (optional, default disabled) with consent toggle.

## Phase 5 – Pilot Launch & Monitoring (Weeks 9–12)

### Development Tasks

- Conduct closed beta with seed tokens; gather telemetry via optional analytics logs.
- Tune rate limits and Cloud Function logging based on pilot feedback.
- Finalize donation/premium flows placeholder screens (inform users of upcoming support options).
- Prepare release checklist and regression test plan.

### Service Actions

- Create Firebase Firestore dashboards/exports for monitoring token usage.
- Set up alerting (email via Google Workspace) for Cloud Function errors and quota warnings.
- Produce quarterly key rotation plan for tokens and Drive service account credentials.

## Ongoing Operations

- Weekly: review Firestore usage counters, revoke abused tokens, publish community update.
- Monthly: rotate Drive folder IDs if download load is heavy; update manifest and notify users.
- Quarterly: rotate Firebase Function secrets and review security posture.

## Dependencies & Sequencing Notes

- Token service (Phase 2) must precede manifest updater (Phase 3) because downloads require signed URLs.
- Documentation rollout (Phase 4) depends on finalized token UX and packaging workflow.
- Pilot launch (Phase 5) requires stable updater and monitoring dashboards from earlier phases.

---

Prepared: 2025-09-15
