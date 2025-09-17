# Google Apps Script (Legacy Coupon Service)

This directory contains a reference Google Apps Script implementation used by the legacy coupon workflow. It remains available for teams that cannot deploy the Firebase token service yet.

## Usage

1. Copy `Code.gs` into a new Apps Script project.
2. Replace the placeholder `SPREADSHEET_ID` and `SECRET_KEY` values.
3. Deploy the script as a web app and configure the time-driven trigger as described in `docs/DEPLOY_APPS_SCRIPT.md`.
4. Store the generated Web App URL and shared secret in your secure configuration (`config/ourlibrary_secret.json`).

## Migration Notes

- The Firebase-based token service is the preferred approach for production deployments.
- Retain this script only for transitional environments or lightweight pilots where the Firebase stack is unavailable.
- Keep the shared secret out of version control and rotate it if exposure is suspected.
