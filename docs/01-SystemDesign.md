# Developer-Ready OurLibrary Access & Control Platform Design Document

* **MySQL** is positioned as both the *analytics/data warehouse* (Doc 1) **and** the *system of record/source of truth* (Doc 3).
* **SQLite** retains Doc 1’s role (local `TierCode` + `AccessMode` enforcement for the app) while also borrowing Doc 3’s snapshot discipline (no secrets, metadata only).
* **Quotas**: the **coupon system** (Docs 1&2) is kept as primary, but I note where Doc 3’s “broker vs static manifest” could evolve the design later.
* **Access Control**: enforced **client-side with SQLite fields + Drive ACLs** (Doc 1’s choice), with server-side quota enforcement via Apps Script. Doc 3’s broker/encryption is noted as optional future expansion.

Here’s the consolidated artifact:

---

# OurLibrary — Consolidated System Design (v2.5 Draft)

**Standard:** AIDEV-PascalCase-2.5
**Audience:** Developers (backend, client, operations)
**Scope:** Unified design based on Docs 1–3 with conflict resolution (priority: Doc 1 → Doc 2 → Doc 3).

---

## 1) Purpose & Philosophy

* **Mission:** Deliver education content affordably and securely.

* **Guiding principles:**
  
  * Keep infra light (serverless where possible).
  * Strong separation of concerns.
  * Multiple layers of enforcement (SQLite UI, Apps Script quotas, Drive ACLs).
  * Auditability and analytics for growth.

---

## 2) System Architecture

* **Client:** Electron desktop app with local SQLite snapshot.
* **Control Plane:** Google Apps Script (REST API + Sheets backend).
* **Content Store:** Google Drive (two sibling folders, Free vs Premium).
* **Analytics / Source of Truth:** MySQL database (central catalog, user/device state, usage metrics).

### High-level Flow

1. App loads SQLite snapshot (Books, Categories, Subjects).
2. User actions (preview/download) → validated against `TierCode` + `AccessMode`.
3. Downloads consume coupons via Apps Script API.
4. All events posted to Google Sheets, ingested into MySQL for analytics.
5. Daily publisher builds new SQLite snapshot from MySQL → distributed to clients.

---

## 3) Data Model

### SQLite (Client Snapshot)

* **Books(ID, Filename, Title, Author?, Category\_ID, Subject\_ID, GoogleDriveID, TierCode, AccessMode, …legacy text fields)**
* **Categories, Subjects, DatabaseMetadata**
* Contains **TierCode + AccessMode** so app can enforce UI access rules locally.
* Snapshot signed/daily refreshed. No secrets beyond Drive IDs.

### MySQL (Source of Truth + Analytics)

* **Catalog**: Mirrors SQLite `Books` (+ categories/subjects).
* **Users, Devices, UserDevices**: Account/device mapping.
* **DeviceBookState, DownloadHistory, Events**: Current + audit trail.
* **Staging**: DeviceEvents (from Sheets).
* Acts as authoritative catalog + analytics warehouse.

### Google Sheets (Control Plane)

* **DeviceEvents\_YYYY\_MM**: append-only event log.
* **CouponBalances**: current state per user.
* **CouponLedger**: auditable quota transactions.
* **Roster**: user tier + entitlements.

---

## 4) Access Control

* **TierCode enforcement** (F, P, T): applied in client UI via SQLite + confirmed at server (coupon check).

* **AccessMode enforcement** (D vs V):
  
  * Downloadable → coupon required (Free tier).
  * View-only → Drive “disable download/print/copy.”

* **MySQL** + **Sheets** provide authoritative entitlements.

* Future: optional Broker or Encrypted Assets path for stricter enforcement.

---

## 5) Quota & Coupon System

### Daily Replenishment (Apps Script, 00:00 UTC)

* Free users: +2 coupons.
* Premium: effectively unlimited (set high number, e.g. 9999).
* Trial: configurable (Premium-like but time-boxed).

### Consumption

* App requests `consume` API before download.
* Apps Script decrements coupon, logs to ledger.
* Failure (insufficient coupons) → graceful denial.

### Audit

* All coupon transactions journaled.
* Ingestion → MySQL for quota analytics, conversion funnels, and abuse detection.

---

## 6) File Organization & Drive Integration

* **Folders**: `OurLibrary_Free`, `OurLibrary_Premium`.
* Placement driven by `TierCode`.
* Drive ACLs enforce view-only vs download.
* Daily Drive audit script reconciles file placement & permissions.

---

## 7) Security Model

* **HMAC-SHA256** on all client API calls (rotating keys).
* **EventUID** ensures idempotency.
* **SQLite signatures**: publisher signs manifest daily; app verifies on load.
* **Drive ACLs**: final enforcement of view-only vs downloadable content.

---

## 8) Event & Analytics Pipeline

* App posts events → Apps Script → Sheets.

* Cron ingestor syncs to MySQL (append DownloadHistory, update DeviceBookState).

* MySQL used for dashboards:
  
  * Downloads by tier/user/time.
  * Reading engagement.
  * Quota usage & conversion opportunities.

* Publisher builds next day’s SQLite snapshot from MySQL.

---

## 9) Client Application Flow

1. **Login:** get current coupon balance, load SQLite snapshot.

2. **Preview:** always allowed if tier matches; log READ\_PREVIEW.

3. **Download:**
   
   * Validate tier + `AccessMode='D'`.
   * Request coupon consumption.
   * If approved, allow Drive download; log event.

4. **Sync (Premium):** MySQL recommends jobs for multi-device sync.

---

## 10) Ops & Automation

* **Daily Snapshot Publisher:** MySQL → SQLite build + sign → distribute.
* **Nightly Coupon Reset:** replenish balances.
* **Sheets Ingestor (cron):** pull NEW events, upsert MySQL.
* **Drive Sync Audit:** verify file placement + permissions.
* **Policy Lint Reports:** book counts, mismatches, sync errors.

---

## 11) Evolution Paths

* Start with **coupon system + Drive ACLs** (Doc 1/2).
* Later add Doc 3’s **broker strict quotas** or **encrypted assets + manifest** for more sophisticated quota enforcement.
* Maintain compatibility: schema supports both approaches.

---

## 12) Developer Notes

* Favor **PascalCase** for schema, classes, and files.
* All scripts require Himalaya headers (AIDEV-PascalCase-2.5).
* Tests must cover: free vs premium entitlements, coupon exhaustion, Drive ACL mismatches, multi-device sync.
* Instrument events for observability and analytics readiness.

---

✅ This merged spec preserves the **coupon-driven access control** (Docs 1 & 2) as the baseline while leaving hooks for Doc 3’s stricter models. MySQL is the **source of truth** *and* the analytics warehouse, SQLite is the **client snapshot + UI enforcement tool**, and Google Apps Script/Sheets handle **quotas and event collection**.

---

Executive Summary — OurLibrary Access & Control Platform

OurLibrary is a next-generation, serverless content distribution system built to make educational resources widely available while preserving publisher control and enabling sustainable growth. It combines the best of Google’s free ecosystem with a robust local client and analytics-grade backend.

🚀 Key Features

1. Multi-Layered Access Control

Tiered entitlements (Free, Premium, Trial) enforced at three layers:

Local app (SQLite snapshot: TierCode + AccessMode)

Serverless quota engine (Google Apps Script + Sheets)

Google Drive ACLs (downloadable vs view-only)

Ensures fair access for Free users while preserving value for Premium subscribers.

2. Coupon-Based Quota System

Daily replenishment: Free users get 2 coupons; Premium users unlimited.

Consumption API: Coupons are decremented before each download.

Audit trail: Every transaction logged in Google Sheets & mirrored to MySQL.

Balances user freedom with transparent, measurable controls.

3. Secure, Auditable Distribution

Google Drive as the universal content store:

Two top-level sibling folders: Free & Premium.

View-only enforced with Drive’s disable download/print/copy.

Daily snapshot publishing: MySQL → signed SQLite → distributed to apps.

Event logging: Every download, preview, and sync action captured and auditable.

4. Developer-Friendly Data Architecture

SQLite (Client): Lightweight catalog snapshot, simple to distribute, zero secrets.

MySQL (Central): Source of truth + analytics warehouse.

Google Sheets (Control Plane): Append-only journal and coupon balances.

Apps Script (Backend): Quota enforcement & API endpoints secured with HMAC.

A clean separation of roles, easy to maintain and scale.

5. Analytics & Growth Insights

MySQL dashboards track:

Downloads by tier, title, and user.

Reading engagement and preview behavior.

Quota pressure (Free users hitting limits → upgrade opportunities).

Enables data-driven decisions for content, pricing, and user conversion.

6. Future-Proof & Extensible

Current baseline: coupon system with Drive ACLs (simple, proven, serverless).

Optional next steps (no rewrites needed):

Broker model: strict per-user quotas via signed download URLs.

Encrypted assets + static manifest: scalable good-faith enforcement.

Designed to evolve as usage grows — cheap to run, hard to abuse.

🎯 Why This Matters

For users: Seamless access, clear rules, free tier generosity.

For publishers: Strong protection, clear upgrade path, low infrastructure cost.

For developers: Transparent architecture, audit-friendly data model, future-proof design.

OurLibrary strikes the perfect balance between accessibility, control, and scalability — delivering knowledge securely while staying lean, resilient, and developer-friendly.
