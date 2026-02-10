# Environment Variables Reference

This document specifies all environment variables used by the Tien Len application.

## Web Application (Next.js)

Environment variables for the web frontend located at `/apps/web`.

### NEXT_PUBLIC_SOCKET_URL

**Type:** String (URL)

**Default:** `http://localhost:3001`

**Description:** WebSocket server URL for real-time game communication. Must be publicly accessible as it is used in client-side code.

**Format:** Full URL including protocol and port

**Examples:**
- Development: `http://localhost:3001`
- Production: `https://api.example.com`
- Custom port: `http://localhost:8080`

**Configuration:**

Create `/apps/web/.env.local`:

```bash
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
```

**Notes:**
- Variable is prefixed with `NEXT_PUBLIC_` to expose it to browser code
- Changes require application restart
- Must match the server's listening address and CORS configuration

### NEXT_PUBLIC_JWT_SECRET

**Type:** String

**Default:** `dev-secret-change-in-production`

**Description:** Secret key for JWT token generation and validation. Used for player authentication.

**Requirements:**
- Minimum length: 16 characters (recommended: 32+ characters)
- Should be cryptographically random in production
- Must match server's `JWT_SECRET`

**Security:**
- Change default value in production
- Use strong random string (e.g., output of `openssl rand -base64 32`)
- Keep secret in version control (use `.env.local`, not committed)

**Configuration:**

```bash
NEXT_PUBLIC_JWT_SECRET=your-32-character-minimum-secret
```

**Notes:**
- Despite `NEXT_PUBLIC_` prefix, treat as sensitive
- Rotating this value invalidates all existing sessions

### TURSO_DATABASE_URL

**Type:** String (URL)

**Default:** None (required if using database features)

**Description:** Connection URL for Turso database (LibSQL).

**Format:** `libsql://[database-name].[organization].turso.io`

**Example:**

```bash
TURSO_DATABASE_URL=libsql://tienlen-db.example.turso.io
```

**Notes:**
- Optional: only required if application uses persistent storage
- Obtain from Turso dashboard
- Not currently used in core game logic

### TURSO_AUTH_TOKEN

**Type:** String

**Default:** None (required if using Turso database)

**Description:** Authentication token for Turso database access.

**Security:**
- Keep secret (never commit to version control)
- Rotate periodically
- Obtain from Turso dashboard

**Example:**

```bash
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
```

**Notes:**
- Optional: only required if using TURSO_DATABASE_URL
- Not currently used in core game logic

## Server Application (Node.js)

Environment variables for the WebSocket server located at `/apps/server`.

### PORT

**Type:** Number

**Default:** `3001`

**Description:** Port number on which the WebSocket server listens for connections.

**Range:** 1-65535 (typically 3000-9000 for development)

**Configuration:**

Create `/apps/server/.env`:

```bash
PORT=3001
```

**Examples:**
- Development: `3001`
- Production: `80`, `443`, or behind reverse proxy
- Docker: Match container exposed port

**Notes:**
- Must be available (not in use by another process)
- Firewall rules must allow incoming connections
- Should match client's `NEXT_PUBLIC_SOCKET_URL` port

### JWT_SECRET

**Type:** String

**Default:** `dev-secret-change-in-production`

**Description:** Secret key for JWT token generation and validation. Used for player authentication.

**Requirements:**
- Minimum length: 16 characters (enforced by validation)
- Recommended: 32+ characters
- Should be cryptographically random in production

**Security:**
- MUST change default value in production
- Use strong random string: `openssl rand -base64 32`
- Keep secret (never commit to version control)
- Must match web application's `NEXT_PUBLIC_JWT_SECRET`

**Configuration:**

```bash
JWT_SECRET=change-me-to-a-32-character-minimum-secret
```

**Validation:**
- Server exits with error if shorter than 16 characters (in production)
- Error message: "Invalid environment variables: JWT_SECRET"

**Notes:**
- Rotating this value invalidates all existing client sessions
- Server restart required after changes

### CORS_ORIGIN

**Type:** String (comma-separated URLs)

**Default:** `http://localhost:3000`

**Description:** Allowed origins for Cross-Origin Resource Sharing (CORS). Controls which web clients can connect to the WebSocket server.

**Format:** Comma-separated list of full URLs (including protocol and port)

**Examples:**

Single origin:
```bash
CORS_ORIGIN=http://localhost:3000
```

Multiple origins:
```bash
CORS_ORIGIN=http://localhost:3000,https://example.com,https://www.example.com
```

Production with multiple domains:
```bash
CORS_ORIGIN=https://tienlen.com,https://www.tienlen.com,https://beta.tienlen.com
```

**Security:**
- Only add trusted domains
- Avoid using `*` wildcard in production
- Include all subdomains if needed (e.g., `www.`, `beta.`)
- Protocol matters: `http` and `https` are different origins

**Common Issues:**
- CORS errors if web app origin not listed
- Whitespace in comma-separated list (automatically trimmed)
- Missing protocol (must include `http://` or `https://`)

**Notes:**
- Changes require server restart
- WebSocket upgrade requests validate against this list

### NODE_ENV

**Type:** String (enum)

**Default:** `development`

**Description:** Node.js environment mode. Affects logging, error handling, and security features.

**Valid Values:**
- `development`: Verbose logging, relaxed validation, development defaults
- `production`: Minimal logging, strict validation, production optimizations

**Configuration:**

Development:
```bash
NODE_ENV=development
```

Production:
```bash
NODE_ENV=production
```

**Effects by Environment:**

**Development Mode:**
- Detailed error messages sent to clients
- Verbose console logging
- Accepts default JWT_SECRET
- Relaxed rate limiting
- Full stack traces in logs

**Production Mode:**
- Generic error messages to clients
- Minimal logging (errors and warnings only)
- Requires strong JWT_SECRET (16+ characters)
- Strict rate limiting
- Sanitized error responses

**Notes:**
- Many hosting providers automatically set this
- Some npm packages check this value for optimizations
- Affects Node.js internal optimizations

## Environment File Locations

### Web Application

**Development:**
- File: `/apps/web/.env.local`
- Gitignored: Yes (not committed)

**Production:**
- Set via hosting provider (Vercel, Netlify, etc.)
- Or use `.env.production.local` file

### Server Application

**Development:**
- File: `/apps/server/.env`
- Gitignored: Yes (not committed)

**Production:**
- Set via hosting provider environment variables
- Or use `.env.production` file

## Example Configuration Files

### Example: Development Setup

`/apps/web/.env.local`:
```bash
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_JWT_SECRET=dev-secret-change-in-production
```

`/apps/server/.env`:
```bash
PORT=3001
JWT_SECRET=dev-secret-change-in-production
CORS_ORIGIN=http://localhost:3000
NODE_ENV=development
```

### Example: Production Setup

`/apps/web/.env.production.local` (or hosting provider):
```bash
NEXT_PUBLIC_SOCKET_URL=https://api.tienlen.com
NEXT_PUBLIC_JWT_SECRET=Kn9mT2pL8xQ4vR7yW3sF6uZ1nB5hD0jG
```

`/apps/server/.env` (or hosting provider):
```bash
PORT=3001
JWT_SECRET=Kn9mT2pL8xQ4vR7yW3sF6uZ1nB5hD0jG
CORS_ORIGIN=https://tienlen.com,https://www.tienlen.com
NODE_ENV=production
```

## Security Checklist

Before deploying to production:

1. Change all default secrets (`JWT_SECRET`, `NEXT_PUBLIC_JWT_SECRET`)
2. Use strong random strings (32+ characters)
3. Verify JWT secrets match between web and server
4. Restrict `CORS_ORIGIN` to actual production domains
5. Set `NODE_ENV=production`
6. Ensure environment files are gitignored
7. Use hosting provider's secret management (not plain files)
8. Rotate secrets periodically
9. Audit environment variables for sensitive data

## Troubleshooting

### Connection refused / CORS errors

**Problem:** Web app cannot connect to WebSocket server

**Solutions:**
1. Verify `NEXT_PUBLIC_SOCKET_URL` matches server address
2. Check server `PORT` is correct and accessible
3. Confirm web app origin is in server's `CORS_ORIGIN`
4. Check firewall allows connections to server port

### Authentication failures

**Problem:** Clients receive authentication errors

**Solutions:**
1. Verify `JWT_SECRET` matches between web and server
2. Ensure secret is at least 16 characters
3. Check for whitespace or encoding issues in secret
4. Clear browser storage and reconnect

### Server won't start

**Problem:** Server exits immediately with error

**Solutions:**
1. Check `PORT` is not already in use
2. Verify `JWT_SECRET` meets minimum length (16 chars)
3. Ensure `NODE_ENV` is valid (`development` or `production`)
4. Check server logs for validation errors

### Environment variables not loading

**Problem:** Variables show as undefined

**Solutions:**
1. Verify file is named correctly (`.env.local` for web, `.env` for server)
2. Restart development server after changes
3. Check file is in correct directory (`/apps/web` or `/apps/server`)
4. Ensure `NEXT_PUBLIC_` prefix for client-side variables
5. Confirm no syntax errors in environment file

## Loading Priority

### Next.js (Web)

Environment files are loaded in this order (later overrides earlier):

1. `.env` (committed, all environments)
2. `.env.local` (gitignored, overrides `.env`)
3. `.env.[NODE_ENV]` (environment-specific, e.g., `.env.production`)
4. `.env.[NODE_ENV].local` (gitignored, environment-specific override)

### Node.js (Server)

Environment variables are loaded in this order:

1. Process environment variables (from shell or hosting provider)
2. `.env` file (if exists)
3. `.env.production` or `.env.development` (based on `NODE_ENV`)

**Note:** Process environment variables always take precedence over file-based configuration.
