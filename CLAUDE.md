# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

OurLibrary is a serverless content distribution system built with Electron, Firebase, and Google Drive. It provides secure, token-controlled access to educational content while operating on free-tier infrastructure.

**Architecture:**

- **Electron Desktop App** (`app/`): Client runtime with local SQLite database for offline access
- **Shared Core** (`core/`): Bootstrap utilities, token service client, database and filesystem modules
- **Operational Scripts** (`scripts/`): CLI tools for token management and release packaging
- **Token Service** (`services/token-service/`): Firebase Cloud Functions for issuing signed Drive URLs
- **Documentation** (`docs/`): Project charter, system design, deployment guides

## Development Commands

### Monorepo Operations

```bash
# Install all dependencies across workspaces
npm install

# Start the Electron app in development mode
npm run start

# Build the desktop application
npm run build

# Run all tests across core and scripts
npm test

# Run tests for a specific workspace
node --test core/tests/*.test.js
node --test scripts/tests/*.test.js
```

### Token Management

```bash
# Create distribution tokens (requires Firebase service account credentials)
npm run manage-tokens create --tier free --max-downloads 10
npm run manage-tokens revoke <tokenId>
npm run manage-tokens list

# Set Firebase service account path
export FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccount.json
```

### Release Packaging

```bash
# Package release archives, compute hashes, update manifest
npm run package-release

# Build offline-friendly AppImage with embedded assets
APPIMAGE_EXTRACT_AND_RUN=1 npm run build
```

### Token Service Development

```bash
cd services/token-service/functions

# Deploy Firebase Cloud Functions
npm run deploy

# Run local emulators for testing
npm run serve

# Lint functions code
npm run lint
```

## Code Architecture

### Core Bootstrap System (`core/bootstrap.js`)

- Initializes `~/OurLibrary` directory structure on first launch
- Downloads and extracts SQLite database from token-protected Drive URLs
- Handles offline-first operation with bundled fallback database
- Manages database migrations and schema updates

### Token Service Integration (`core/modules/tokenClient.js`)

- Requests short-lived, signed Google Drive URLs from Firebase Cloud Functions
- Implements rate limiting and caching for token validation
- Falls back to offline mode when network unavailable
- Integrates with desktop app's entitlement enforcement

### Database Layer (`core/modules/database.js`)

- SQLite database with Books, Categories, Subjects tables
- Enforces `TierCode` (F/P/T) and `AccessMode` (D/V) rules locally
- Supports snapshot-based updates with SHA-256 verification
- Provides query interface for desktop app UI

### Release Management (`scripts/package-release.js`)

- Exports SQLite database and assets to versioned zip archives
- Uploads to Google Drive via service account credentials
- Generates manifest.json with file metadata and checksums
- Registers release files in Firestore for token service lookup

### Firebase Cloud Functions (`services/token-service/functions/`)

- `issueDownloadUrl`: Validates tokens and returns signed Drive URLs
- `issueDownloadUrlHttp`: HTTP endpoint for clients without Firebase SDK
- Enforces per-token rate limits and usage quotas
- Logs all access attempts for audit trails

## Configuration Setup

Before development, copy and populate configuration templates:

```bash
# Create local configuration files from templates
cp config/templates/google_credentials.example.json config/google_credentials.json
cp config/templates/ourlibrary_secret.example.json config/ourlibrary_secret.json
cp config/templates/ourlibrary_config.example.json config/ourlibrary_config.json
```

**Required Environment Variables:**

- `OURLIBRARY_TOKEN_ENDPOINT`: Firebase Cloud Function URL for token validation
- `FIREBASE_SERVICE_ACCOUNT_PATH`: Path to service account JSON for admin operations
- `OURLIBRARY_TOKEN_HTTP_ENDPOINT`: HTTP fallback endpoint (optional)

## Security & Compliance Requirements

### Credential Management

- **Never commit** real credentials or service account keys to the repository
- Use environment-specific `.env` files for development secrets
- Store production credentials in encrypted vaults
- Rotate secrets immediately if exposure is suspected

### Code Standards

- Follow **AIDEV-PascalCase-2.1** naming conventions for all files and variables
- Include proper file headers with creation/modification timestamps
- Use PascalCase for directories, files, variables, and functions
- All database schema fields use PascalCase notation

### Testing Requirements

- Write unit tests for all core modules (bootstrap, database, filesystem)
- Test offline-first behavior and network failure scenarios
- Validate token service integration with Firebase emulators
- Include checksum verification and rollback testing for releases

### Safety Practices

- Client apps carry no OAuth secrets or long-lived credentials
- All network calls use TLS 1.2+ with HMAC signing
- SQLite databases are read-only at runtime; writes limited to migrations
- Drive access mediated exclusively by server-side service accounts

## Service Dependencies

### Firebase Project Setup

- Enable Authentication, Firestore, Cloud Functions, and Hosting
- Configure Firestore security rules to restrict usage counter access
- Set up Cloud Functions environment variables for Drive integration
- Create service accounts with Drive read scope (no keys distributed)

### Google Drive Organization

- Two top-level folders: `OurLibrary_Free` and `OurLibrary_Premium`
- Content placement driven by `TierCode` from database
- Drive ACLs enforce view-only vs downloadable permissions
- Daily audit scripts reconcile file placement and permissions

### Analytics Pipeline

- Events posted to Google Sheets via Apps Script endpoints
- Nightly ingestion from Sheets to MySQL data warehouse
- MySQL serves as both system of record and analytics database
- Supports usage metrics, quota tracking, and conversion analytics

## Development Workflow

1. **Feature Development**: Work in feature branches off `main`
2. **Testing**: Run unit tests locally, use Firebase emulators for integration testing
3. **Security Review**: PRs with security changes require reviewer approval
4. **Documentation**: Update operator notes and runbooks for each feature
5. **Staging Validation**: Test with staging token pool before production deployment

## Troubleshooting

### Common Issues

- **Build Failures**: Check that Electron version matches dependencies (`electron: 38.1.2`)
- **Token Service Errors**: Verify Firebase service account credentials and endpoint URLs
- **Database Corruption**: Use rollback functionality with previous verified snapshots
- **Network Issues**: Application operates in offline mode with bundled fallback database

### Debug Commands

```bash
# Check Firebase Functions logs
firebase functions:log

# Validate manifest integrity
node -e "console.log(require('./scripts/package-release.js').validateManifest())"

# Test bootstrap with clean directory
rm -rf ~/OurLibrary && npm start
```

## Release Process

1. **Build SQLite snapshot** from MySQL source of truth
2. **Package release** with `npm run package-release`
3. **Upload to Drive** via service account
4. **Update manifest** with new version metadata
5. **Deploy functions** if token service changes required
6. **Test end-to-end** with staging tokens before production distribution

Follow `docs/RELEASE_CHECKLIST.md` for complete release workflow.