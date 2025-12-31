# Deploy Boggle Party on Coolify

This guide covers deploying Boggle Party to [Coolify](https://coolify.io), a self-hosted PaaS alternative to Vercel/Netlify.

## Prerequisites

- Coolify instance running (v4+)
- Git repository with your code (GitHub, GitLab, etc.)
- Pusher account for real-time features

## Deployment Options

### Option A: Docker Compose (Recommended for Full Control)

This method uses `docker-compose.prod.yml` and runs both the web application and PostgreSQL database.

#### Step 1: Connect Your Repository

1. In Coolify, click **+ New Resource** > **Docker Compose**
2. Select your Git repository and branch
3. Set the **Docker Compose Path** to `docker-compose.prod.yml`

#### Step 2: Configure Environment Variables

Add these environment variables in Coolify:

```bash
# Web service
DATABASE_URL=postgresql://boggle_user:<password>@db:5432/boggle_party
PUSHER_APP_ID=<your_pusher_app_id>
PUSHER_KEY=<your_pusher_key>
PUSHER_SECRET=<your_pusher_secret>
PUSHER_CLUSTER=<your_pusher_cluster>
PUSHER_USE_TLS=true
NEXT_PUBLIC_PUSHER_KEY=<your_pusher_key>
NEXT_PUBLIC_PUSHER_CLUSTER=<your_pusher_cluster>

# Database service (separate resource in Coolify)
POSTGRES_DB=boggle_party
POSTGRES_USER=boggle_user
POSTGRES_PASSWORD=<generate_strong_password>
```

**Note:** `NODE_ENV`, `PORT`, and `HOSTNAME` are already set in the docker-compose file.

#### Step 3: Configure Ports

**No configure ports manualmente** - Coolify + Traefik gestionan el routing automáticamente.

#### Step 4: Deploy

Click **Deploy** and wait for the build to complete.

### Option B: Nixpacks/Static Build (Coolify Managed)

If you prefer Coolify to handle the build process automatically:

#### Step 1: Create New Resource

1. Click **+ New Resource** > **Application**
2. Select your repository and branch
3. Build Pack: **Nixpacks** (auto-detects Next.js)

#### Step 2: Configure Build Settings

In Coolify, set these build settings:

```bash
# Build Command
pnpm install && pnpm build

# Start Command
pnpm start

# Install Command
pnpm install
```

#### Step 3: Configure Database

1. In Coolify, add a **PostgreSQL** resource
2. Coolify will provide the `DATABASE_URL`
3. Add it to your application's environment variables

#### Step 4: Environment Variables

```bash
NODE_ENV=production
DATABASE_URL=<from_coolify_db_resource>
PUSHER_APP_ID=<your_pusher_app_id>
PUSHER_KEY=<your_pusher_key>
PUSHER_SECRET=<your_pusher_secret>
PUSHER_CLUSTER=<your_pusher_cluster>
PUSHER_USE_TLS=true
NEXT_PUBLIC_PUSHER_KEY=<your_pusher_key>
NEXT_PUBLIC_PUSHER_CLUSTER=<your_pusher_cluster>
```

### Option C: Dockerfile (Custom Build)

1. Click **+ New Resource** > **Dockerfile**
2. Set **Dockerfile Path** to `Dockerfile`
3. Configure environment variables as shown in Option B

## Post-Deployment Setup

### Run Database Migrations

After deployment, you need to run the migrations:

```bash
# Via Coolify terminal (if available)
pnpm migrate

# Or via SSH into the container
docker exec -it <container_id> pnpm migrate
```

### Health Check

The application exposes a health check endpoint:

```
https://your-domain.coolify.io/api/health
```

Expected response (200 OK):
```json
{
  "status": "ok",
  "timestamp": "2025-12-31T...",
  "services": {
    "database": "connected",
    "schema": "migrated",
    "dictionary": "loaded"
  },
  "metrics": {
    "activeRooms": 0
  }
}
```

## Pusher Configuration

Boggle Party requires Pusher for real-time game synchronization:

1. Sign up at [pusher.com](https://pusher.com)
2. Create a new app (select **Channels**)
3. Copy your credentials to Coolify environment variables
4. Enable **Client Events** in your Pusher dashboard settings

## Domain & SSL

Coolify automatically handles SSL certificates via Let's Encrypt:

1. Go to your application in Coolify
2. Click **Domains**
3. Add your custom domain
4. SSL is provisioned automatically

## Monitoring

### Logs

View logs in Coolify: **Application** > **Logs**

### Health Monitoring

The health check endpoint (`/api/health`) monitors:
- Database connectivity
- Schema migration status
- Dictionary loading status
- Active room count

Coolify can be configured to restart containers based on health checks.

## Troubleshooting

### Build Fails

- Ensure `node:22-alpine` is available in your registry
- Check that `pnpm-lock.yaml` is committed
- Verify build logs in Coolify

### Database Connection Errors

- Verify `DATABASE_URL` matches Coolify's provided connection string
- Check if PostgreSQL container is running
- Ensure migrations have been run

### Real-time Features Not Working

- Verify Pusher credentials are correct
- Check Pusher dashboard for connection errors
- Ensure client-side `NEXT_PUBLIC_*` variables are set

### Container Restarting Repeatedly

- Check health endpoint: `/api/health`
- Review container logs for errors
- Verify resource limits (CPU/RAM) are sufficient

## Resource Limits

**Note:** The `deploy:` section in docker-compose is ignored by Coolify (only applies to Docker Swarm).

Resource limits in Coolify are configured from the UI:

1. Go to your application in Coolify
2. Click **Settings** > **Resources**
3. Set CPU and Memory limits for each service

**Recommended configuration:**

| Service | CPU Limit | Memory Limit |
|---------|-----------|--------------|
| Web     | 1 CPU     | 512MB        |
| DB      | 0.5 CPU   | 256MB        |

Adjust based on your expected traffic.

## Backup Strategy

For production:

1. Enable Coolify's automatic backups (if available)
2. Regularly export PostgreSQL database:
   ```bash
   docker exec boggle_postgres pg_dump -U boggle_user boggle_party > backup.sql
   ```
3. Store backups off-site (S3, Backblaze, etc.)

## Security Checklist

- [ ] Change default `POSTGRES_PASSWORD` to strong random value
- [ ] Use Coolify's managed database service
- [ ] Enable SSL/TLS for all connections
- [ ] Restrict Pusher allowed origins
- [ ] Set up firewall rules in Coolify
- [ ] Regularly update base images (node:22-alpine, postgres:16-alpine)
- [ ] Monitor logs for suspicious activity

## Cost Optimization

- Use a single PostgreSQL instance for multiple apps
- Enable container auto-scaling based on traffic
- Set appropriate resource limits
- Regularly clean up unused Docker images

## Support

- **Coolify Docs**: https://coolify.io/docs
- **Boggle Party Issues**: GitHub Issues
- **Pusher Support**: https://pusher.com/docs
