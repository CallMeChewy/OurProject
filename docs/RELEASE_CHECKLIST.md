# Release Packaging Checklist

Use this checklist when preparing a new OurLibrary database release. The steps assume you have Firebase/Firestore access and Drive permissions.

1. **Prepare updated database**
   - Apply curation updates to the master SQLite file.
   - Run validation queries and confirm the `DatabaseMetadata` table has the new version tag.

2. **Run the packaging helper**
   ```bash
   npm run package-release --workspace scripts -- \
     --database /path/to/OurLibrary.db \
     --version 2025.09.18 \
     --output dist/releases/2025.09.18 \
     --manifest config/manifest.local.json \
     --notes-file docs/release-notes/2025-09-18.md \
     --asset app/Assets/sql.js/sql-wasm.wasm:Assets/sql.js/sql-wasm.wasm
   ```
   - Review the generated archive, metadata, and manifest changes.
   - Repeat with `--dry-run` before the first execution on a new host.

3. **Upload to Drive**
   - Upload `OurLibrary-db-<version>.zip` to the Drive folder used by the token service.
   - Copy the resulting file ID.

4. **Embed Drive file ID**
   ```bash
   npm run package-release --workspace scripts -- \
     --database /path/to/OurLibrary.db \
     --version 2025.09.18 \
     --output dist/releases/2025.09.18 \
     --manifest config/manifest.local.json \
     --file-id <drive-file-id> \
     --skip-manifest false --force
   ```
   - This rewrites the manifest and metadata to include the Drive ID.

5. **Register in Firestore**
   - Create/update `archives/{version}` with `fileId`, `sha256`, `sizeBytes`, `tier`, and optional `innerPath`.
   - If this is the first release, seed `tokens/` with pilot tokens using `npm run manage-tokens`.

6. **Deploy manifest + config**
   - Publish the updated `manifest.json` to Firebase Hosting or the configured CDN.
   - Commit the manifest update and release metadata to version control.

7. **Smoke test**
   - Point a staging desktop build to the new manifest and token endpoint.
   - Confirm download, SHA-256 verification, and zip extraction succeed.
   - Verify quota counters increment in Firestore.

8. **Announce release**
   - Publish notes to the community channel.
   - Archive the release metadata JSON and Drive file ID for future audits.

Keep this checklist in sync with automation changes.
