# OurLibrary Project Best Practices Charter

## 1. Purpose & Scope

This charter defines the non-negotiable practices every contributor must adopt to deliver a safe, low-cost, and delightful OurLibrary release. It consolidates prior design, deployment, and review guidance into an actionable handbook covering architecture, security, cost control, automation, and community expectations.

## 2. Success Criteria

- **Safety**: Zero leaked credentials, tamper-evident content distribution, and auditable access decisions.
- **Cost Discipline**: Operate entirely on existing Google Drive storage and free tiers of Firebase, Apps Script, and GitHub.
- **User Experience**: Desktop app that boots offline, enforces entitlements gracefully, and updates with minimal friction.
- **Sustainable Operations**: Automated build, packaging, and monitoring so maintainers can support growth without manual heroics.
- **Community Momentum**: Deliver a first release that earns trust, enabling donations or sponsorship for later upgrades.

## 3. Guiding Principles

1. **Safety Before Features**: Any change that jeopardizes credential hygiene or data integrity is blocked until mitigations exist.
2. **Cost-Aware Choices**: Prefer serverless, pay-as-you-go, or manual workflows that avoid new invoices.
3. **User Trust Through Clarity**: Surface entitlement rules, token status, and update progress transparently inside the app.
4. **Automation Over Manual Ops**: Extra engineering effort up front is acceptable when it produces repeatable, low-touch runbooks.
5. **Document or Do Not Ship**: Every feature includes operator notes, contributor hints, and rollback guidance.

## 4. System Overview

- **Client Runtime**: Electron desktop app (`app/`) backed by a local, signed SQLite snapshot enforcing `TierCode` and `AccessMode` rules.
- **Bootstrap Library**: Shared core module (`core/`) that provisions `~/OurLibrary` directories, seeds config, and manages migrations.
- **Control Plane**: Firebase Authentication + Cloud Functions + Firestore counters (or fallback Apps Script) issuing short-lived, signed Google Drive URLs.
- **Content Store**: Private Google Drive folders (`Free`, `Premium`) managed by a publisher script that builds and uploads versioned archives with SHA-256 manifests.
- **Analytics Source of Truth**: MySQL warehouse receiving ingest from Sheets logs and providing snapshot exports.

## 5. Valid Options & Default Selections

| Area                  | Default                                        | Optional Alternative                                                         | Concessions Required                                                                                                            |
| --------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Token Enforcement     | Firebase Callable Function issuing signed URLs | Google Apps Script HTTPS endpoint (for regions where Firebase is restricted) | Alternative must maintain hashed token store, rate limiting, and server-side Drive access; team documents parity before launch. |
| Snapshot Distribution | Firebase Hosting manifest + Drive archive      | Offline media (USB / LAN mirror) for disconnected deployments                | Offline builds follow same manifest schema and hash validation; hosting team maintains monthly sync log.                        |
| Analytics Pipeline    | Sheets → MySQL nightly ingest                  | Local CSV exports when MySQL unavailable                                     | CSV path must pipe back into MySQL within 7 days; no analytics-only features rely on CSV stopgap.                               |
| Authentication        | Token-only first release                       | Email/password upgrade once budget allows                                    | Upgrade requires cost analysis, threat review, and staged rollout plan approved by safety lead.                                 |

## 6. Mandatory Concessions

- **Secret Hygiene**: Remove all credentials (see `SENSITIVE_CREDENTIALS.md`) from the repo, rotate passwords immediately, and store replacements in an encrypted vault. Development credentials live in ignored `.env` files with documented provisioning steps.
- **Monorepo Structure**: Adopt `/app`, `/core`, `/scripts`, `/docs` layout. Legacy duplicated installer code is retired; shared logic moves into `core/bootstrap`.
- **Signed Distribution**: Every SQLite or asset release ships with SHA-256 hash and optional signature verified during install/update.
- **Two-Layer Approval on Risky Changes**: Security-sensitive PRs require review by both the safety and cost stewards.
- **Staging Gate**: No release reaches public users until it completes smoke tests on a staging token pool and downloads from the manifest pipeline.

## 7. Safety Practices

- Token service stores only salted token hashes, enforces per-device and per-day limits, and logs anomalies for review.
- Drive access is mediated exclusively by server-side service accounts; client binaries carry no OAuth secrets or refresh tokens.
- All network calls use TLS 1.2+, with HMAC signing for function requests. Replay protection (`eventUid`) is mandatory.
- SQLite snapshots are read-only in runtime; write access is limited to controlled migrations executed by the bootstrap module.
- Security issues are reported via `SECURITY.md`; incidents must receive triage within 24 hours and public summaries within seven days.

## 8. Cost Control Strategy

- Rely on Firebase Spark tier limits; monitor monthly quotas and export metrics to shared dashboards.
- Apps Script jobs run on time-driven triggers (coupon resets, Drive audits) and stay within free execution quotas; scripts are optimized to batch operations.
- MySQL hosting uses existing community allocation; avoid scaling features that increase storage without sponsorship.
- CDN or premium hosting upgrades require explicit ROI analysis and community fundraising plan before adoption.
- Maintain manual fallback paths (USB distribution, CSV exports) so critical flows continue even if free-tier limits are hit.

## 9. User Experience Commitments

- First launch must succeed offline by reading bundled snapshot; token entry prompts explain why connectivity is needed later.
- Download and update flows present clear progress indicators, quota status, and retry instructions.
- Error messages favor user-friendly language and recovery guidance; logs capture technical detail separately.
- Accessibility is a default requirement—keyboard navigation, readable contrast, and localized strings where feasible.
- Feedback funnel within the app routes to monitored community channels (email form, issue tracker, or forum).

## 10. Automation & Operations

- CI builds generate unsigned AppImage/zip artifacts, run linting (Prettier or equivalent), and execute smoke tests for bootstrapper logic.
- Release script (`scripts/package-release.js`) handles snapshot export, Drive upload via service account, manifest generation, and checksum publication.
- Nightly jobs: coupon reset, manifest integrity audit, Drive permission reconciliation, Sheets-to-MySQL ingest. Failures alert maintainers via email.
- Observability: structured logs (JSON) from Cloud Functions, retained 30 days; severe anomalies escalate automatically.
- Runbooks for each job live under `docs/operations/` and include rollback instructions.

## 11. Developer & Maintainer Responsibilities

- Follow `AGENTS.md` contributor guide for coding standards, testing, and PR etiquette.
- Keep `Gemini Restart Plan.txt` updated after every major change so future agents maintain context.
- Document "Definition of Done" per phase: code merged, tests passing, docs updated, operator runbook touched, staging smoke test signed off.
- Participate in quarterly security and cost reviews; each review produces an action list tracked in the backlog.
- Mentor new contributors by pairing on first PRs and ensuring they understand safety and cost constraints.

## 12. Community & Sustainability Path

- Launch sequence: private pilot → public beta → donation campaign. Every stage publishes transparent metrics (user count, uptime, budget usage).
- Encourage community mirrors and curated content contributions through documented workflows that preserve safety rules.
- Recognize volunteers who uphold the charter (e.g., highlight "Safety Champions" in release notes) to reinforce culture.
- Plan future investments (brokers, encrypted assets, premium auth) only after the community funds or sponsors them.

## 13. Compliance & Enforcement

- Joining the team implies explicit acceptance of this charter. Violations trigger remediation plans; repeated lapses may revoke repo access.
- Changes to this document require consensus from safety, cost, and product leads plus public review to keep trust high.
- Keep the charter versioned; every release references the charter revision that governed its build.

By adhering to this charter, the team can launch a secure, cost-conscious OurLibrary release that delights users, earns community trust, and lays the groundwork for future investment.
