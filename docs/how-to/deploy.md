# How to Deploy the Application

This guide covers deploying the Tien Len card game application to production environments. The frontend (Next.js) deploys to Vercel, and the server (Socket.io) deploys to Railway or any Docker-compatible platform.

## Prerequisites

- Vercel CLI installed: `npm i -g vercel`
- Docker installed (for server deployment)
- Railway account (or alternative Docker hosting)
- Environment variables prepared

## Deploy the Frontend to Vercel

### 1. Build the frontend locally

From the project root:

```bash
npx pnpm --filter web build
```

This builds the Next.js application in `apps/web/.next`.

### 2. Set environment variables

The frontend requires these environment variables:

- `NEXT_PUBLIC_SOCKET_URL` - URL of your deployed server (e.g., `https://your-server.railway.app`)
- `JWT_SECRET` - Secret for JWT token signing (minimum 32 characters)

### 3. Deploy with Vercel CLI

From the project root:

```bash
vercel
```

Follow the prompts to link your project. On subsequent deploys:

```bash
vercel --prod
```

### 4. Configure environment variables in Vercel

In the Vercel dashboard:

1. Go to Project Settings > Environment Variables
2. Add `NEXT_PUBLIC_SOCKET_URL` (your server URL)
3. Add `JWT_SECRET` (same value as server)
4. Redeploy to apply changes

## Deploy the Server with Docker

### 1. Build the Docker image

The Dockerfile is located at `apps/server/Dockerfile`. From the project root:

```bash
docker build -t tienlen-server -f apps/server/Dockerfile .
```

The Dockerfile:
- Uses Node 20 slim base image
- Enables pnpm via corepack
- Installs dependencies with `pnpm install --frozen-lockfile`
- Builds the server with `pnpm --filter @tienlen/server build`
- Exposes port 3001
- Runs `node apps/server/dist/index.js`

### 2. Set environment variables

The server requires these environment variables:

- `PORT` - Server port (default: 3001)
- `JWT_SECRET` - Secret for JWT token signing (must match frontend)
- `CORS_ORIGIN` - Frontend URL for CORS (e.g., `https://your-app.vercel.app`)
- `NODE_ENV` - Set to `production`

### 3. Deploy to Railway

#### Using Railway CLI:

```bash
railway login
railway init
railway up
```

#### Using Docker Hub:

1. Tag and push your image:
   ```bash
   docker tag tienlen-server your-dockerhub-username/tienlen-server
   docker push your-dockerhub-username/tienlen-server
   ```

2. In Railway:
   - Create a new project
   - Deploy from Docker Hub
   - Provide image name: `your-dockerhub-username/tienlen-server`

#### Configure environment variables in Railway:

1. Go to your service > Variables
2. Add all required environment variables:
   - `PORT=3001`
   - `JWT_SECRET=your-secret-here`
   - `CORS_ORIGIN=https://your-app.vercel.app`
   - `NODE_ENV=production`
3. Redeploy the service

### 4. Alternative Docker platforms

The Docker image works with any container hosting service:

- **Render**: Deploy from GitHub with Dockerfile
- **Fly.io**: Use `flyctl launch` with the Dockerfile
- **Google Cloud Run**: Deploy with `gcloud run deploy`
- **AWS ECS**: Push image to ECR and create a task definition

Always configure the same environment variables regardless of platform.

## Verify Deployment

1. Check server health by visiting `https://your-server-url`
2. Open frontend at `https://your-app.vercel.app`
3. Create a room and verify WebSocket connection
4. Check browser console for connection errors
5. Verify CORS_ORIGIN matches your frontend domain

## Troubleshooting

### WebSocket connection fails

- Verify `NEXT_PUBLIC_SOCKET_URL` in Vercel matches your server URL
- Ensure server `CORS_ORIGIN` includes your frontend domain
- Check server logs for connection errors

### JWT token errors

- Confirm `JWT_SECRET` matches between frontend and server
- Ensure secret is at least 32 characters
- Redeploy both services after changing secrets

### Build failures

- Verify pnpm version matches `packageManager` in package.json (9.15.0)
- Check that all workspace dependencies resolve correctly
- Review build logs for TypeScript errors
