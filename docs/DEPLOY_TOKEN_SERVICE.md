# Deploying the Firebase Token Service

Follow these steps to roll out the token service that issues short-lived Google Drive download URLs.

## Prerequisites

- Firebase CLI installed (`npm install -g firebase-tools`).
- Access to the Firebase project with Cloud Functions, Firestore, and Authentication enabled.
- Service account JSON with read access to the Drive folder that stores release archives.
- Node.js 18+ locally.

## 1. Install dependencies

```bash
cd services/token-service/functions
npm install
```

## 2. Configure runtime credentials

Extract these values from the Drive service account JSON and store them in Functions config:

```bash
firebase functions:config:set \
  drive.client_email="service-account@project.iam.gserviceaccount.com" \
  drive.private_key="$(cat /path/to/service-account.json | jq -r '.private_key' | sed 's/\n/\\n/g')"
```

To verify the values were stored:

```bash
firebase functions:config:get
```

## 3. Deploy the functions

```bash
firebase deploy --only functions
```

This publishes both `issueDownloadUrl` (callable) and `issueDownloadUrlHttp` (REST) endpoints.

## 4. Seed Firestore

Create the required collections if they do not exist:

- `tokens/{tokenId}` – distribution token documents.
- `archives/{version}` – release metadata (`fileId`, `sha256`, `sizeBytes`, `tier`, optional `innerPath`).

Example using the CLI:

```bash
node scripts/manage-tokens.js create \
  --tier free \
  --max-downloads 5 \
  --expires-in-hours 24 \
  --firebase-service-account /path/to/admin.json
```

Alternatively, insert documents directly with the Firebase console or an admin script.

## 5. Test the endpoints

Callable (using `firebase emulators:exec` or a temporary script):

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
// invoke app.functions().httpsCallable('issueDownloadUrl') with test data
```

REST:

```bash
curl -X POST https://<region>-<project>.cloudfunctions.net/issueDownloadUrlHttp \
  -H "Content-Type: application/json" \
  -d '{"token":"TOKEN","fileId":"drive-file","version":"2025.09.18"}'
```

Inspect the JSON payload to confirm you receive `downloadUrl`, `quotaRemaining`, and `archive` fields.

## 6. Point the desktop app to staging

Set these environment variables when launching the app:

```bash
export OURLIBRARY_TOKEN_ENDPOINT="https://<region>-<project>.cloudfunctions.net/issueDownloadUrlHttp"
export OURLIBRARY_TOKEN="<pilot-token>"
```

Run the bootstrap flow and confirm:

1. Signed URL download succeeds and passes SHA-256 verification.
2. `archives/{version}` metadata matches the manifest.
3. Firestore counters increment (`tokens/{id}.usageCount`).

## 7. Monitor & maintain

- Enable Cloud Logging filters for `issueDownloadUrl*` to watch for errors.
- Add alerting on Firestore write errors or throttling.
- Rotate the Drive service account key periodically and update Functions config using the steps above.

Keep this document updated as automation improves.
