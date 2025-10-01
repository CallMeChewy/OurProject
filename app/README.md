# OurLibrary Desktop App (v2.0)

Modern Electron application with Firebase token service integration for secure, token-controlled access to educational content.

## Key Features

- 🔐 **Token-Based Authentication**: Secure access without OAuth credentials in the client
- 📚 **Offline-First Library**: Local SQLite database with token-protected updates
- 🚀 **Rate Limiting & Quotas**: Enforced by Firebase Cloud Functions
- 📱 **Modern UI**: Clean, responsive interface with token status indicators
- 🔄 **Automatic Updates**: Manifest-based database updates using token service

## Architecture

### Token Service Integration
- **Client**: Stores and validates distribution tokens
- **Firebase Cloud Functions**: Issues signed Google Drive URLs
- **Rate Limiting**: Per-token download quotas and usage tracking
- **Security**: No OAuth secrets in client, short-lived signed URLs

### Components
- `main.js` - Electron main process with token validation
- `renderer.js` - Frontend UI with token entry and search
- `preload.js` - Secure bridge between main and renderer
- `../core/` - Shared bootstrap and token client modules

## Development Setup

1. **Install Dependencies**
   ```bash
   cd app
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Firebase project details
   ```

3. **Start Development**
   ```bash
   npm start
   ```

## Token Service Setup

The app expects a Firebase Cloud Functions deployment with:

- `issueDownloadUrl` - Callable function for token validation
- `issueDownloadUrlHttp` - HTTP endpoint fallback
- Firestore collections: `tokens`, `archives`, `usage`

### Create Test Tokens
```bash
cd ../scripts
npm run manage-tokens create --tier free --max-downloads 10
```

## Usage Flow

1. **Token Entry**: User enters distribution token on first launch
2. **Token Validation**: Token is validated against Firebase service
3. **Database Initialization**: SQLite database is loaded/bundled with token
4. **Browse & Search**: Users can search the catalog offline
5. **Token-Protected Downloads**: Each download uses token for signed URL

## Security Features

- ✅ No OAuth credentials in client
- ✅ Token-based authentication with expiry
- ✅ Rate limiting and quota enforcement
- ✅ Signed URLs for Drive access
- ✅ Usage tracking and audit trails
- ✅ Secure token storage in user data directory

## Comparison with V1

| Feature | V1 (dist_V1) | V2 (Current) |
|---------|--------------|--------------|
| Authentication | Direct OAuth | Token-Based |
| Security | OAuth Secrets in Client | Zero Secrets in Client |
| Rate Limiting | None | Token Quotas |
| Offline Support | Manual | Bootstrap System |
| Updates | Manual Download | Manifest-Based |
| Auditing | Basic | Full Usage Tracking |

## Testing

```bash
# Run unit tests
npm test

# Test with Firebase emulators
cd ../services/token-service/functions
npm run serve
```

## Building

```bash
npm run build
```

This creates an offline-friendly AppImage with embedded assets and token service integration.