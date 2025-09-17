# Configuration Templates

This directory provides redacted templates for configuration files that must be created locally before running the OurLibrary tooling. Copy the appropriate template to a sibling file without the `.example` suffix and populate the secrets from your secure vault.

## Available Templates

- `google_credentials.example.json` – OAuth client details for Google APIs used during token provisioning.
- `ourlibrary_config.example.json` – Desktop application runtime settings (paths, sync defaults, update cadence).
- `ourlibrary_google_config.example.json` – Metadata distributed with manifest builds (Drive IDs, cache hints).
- `ourlibrary_secret.example.json` – Shared secret for legacy Apps Script endpoints; rotate quarterly.

## Usage

1. Duplicate the template: `cp config/templates/<file>.example.json config/<file>.json`.
2. Fill in the environment-specific values.
3. Ensure `config/*.json` entries are gitignored in the final repository (`config/.gitignore` is provided as a guardrail).
4. Store production credentials in your secrets manager; only development placeholders live on disk.

Never commit populated configuration files or service account keys. If a secret is exposed, follow the incident response checklist in `docs/SECURITY.md` immediately.
