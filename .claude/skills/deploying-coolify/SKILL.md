---
name: deploying-coolify
description: Deploy applications to Coolify self-hosted PaaS. Use when deploying to Coolify, configuring docker-compose for production, setting up environment variables, or troubleshooting deployment issues.
---

# Deploying to Coolify

## Quick Start

Coolify is a self-hosted PaaS that deploys applications via Docker Compose, Dockerfile, or Nixpacks.

**Three deployment methods:**
1. **Docker Compose** (recommended) - Full control over services
2. **Nixpacks** - Coolify auto-detects and builds
3. **Dockerfile** - Custom build process

Choose based on your needs: Docker Compose for multi-service apps, Nixpacks for simple deployments.

## Deployment Workflow

Copy this checklist and track progress:

```
Deployment Progress:
- [ ] Step 1: Choose deployment method
- [ ] Step 2: Configure build settings
- [ ] Step 3: Set environment variables
- [ ] Step 4: Deploy and verify
- [ ] Step 5: Run migrations
- [ ] Step 6: Configure domain/SSL
```

### Step 1: Choose Deployment Method

**Use Docker Compose when:**
- App has multiple services (web + database)
- Need custom service configuration
- Want full control over networking

**Use Nixpacks when:**
- Simple single-service app
- Want Coolify to handle builds
- No custom Docker setup needed

### Step 2: Configure Build Settings

**Docker Compose:**
- Set compose path: `docker-compose.prod.yml`
- Coolify ignores `container_name` and `deploy:` sections
- Don't expose ports (Coolify+Traefik manage routing)

**Nixpacks:**
- Build: `pnpm install && pnpm build`
- Start: `pnpm start`
- Install: `pnpm install`

### Step 3: Environment Variables

Essential variables for Next.js + PostgreSQL + Pusher:

```bash
# Database
DATABASE_URL=<from_coolify_db_or_custom>
POSTGRES_DB=<database_name>
POSTGRES_USER=<db_user>
POSTGRES_PASSWORD=<strong_password>

# Pusher (real-time features)
PUSHER_APP_ID=<your_app_id>
PUSHER_KEY=<your_key>
PUSHER_SECRET=<your_secret>
PUSHER_CLUSTER=<your_cluster>
PUSHER_USE_TLS=true
NEXT_PUBLIC_PUSHER_KEY=<your_key>
NEXT_PUBLIC_PUSHER_CLUSTER=<your_cluster>

# Runtime (often pre-set)
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
```

### Step 4: Deploy and Verify

1. Click **Deploy** in Coolify
2. Monitor build logs
3. Check health endpoint: `https://your-domain.coolify.io/api/health`

Expected health response (200 OK):
```json
{
  "status": "ok",
  "services": {
    "database": "connected",
    "schema": "migrated"
  }
}
```

### Step 5: Run Migrations

After successful deployment:

```bash
# Via Coolify terminal
pnpm migrate

# Or via SSH
docker exec -it <container_id> pnpm migrate
```

### Step 6: Configure Domain/SSL

1. Go to application in Coolify
2. Click **Domains** > **Add custom domain**
3. SSL auto-provisioned via Let's Encrypt

## Docker Compose Best Practices

**DO:**
- Use service names for internal communication (`db:5432`)
- Set resource limits via Coolify UI
- Use Alpine images (`node:22-alpine`, `postgres:16-alpine`)
- Define health checks

**DON'T:**
- Expose ports (Coolify+Traefik handle routing)
- Use `container_name` (conflicts with Coolify)
- Use `deploy:` section (Docker Swarm only)
- Add Traefik labels (Coolify manages them)

## Troubleshooting

**Build fails:**
- Verify base images available in registry
- Check `pnpm-lock.yaml` is committed
- Review build logs in Coolify

**Database connection errors:**
- Verify `DATABASE_URL` format
- Check PostgreSQL container running
- Ensure migrations completed

**Real-time features broken:**
- Verify Pusher credentials (especially `NEXT_PUBLIC_*` vars)
- Check Pusher dashboard for errors
- Ensure Client Events enabled in Pusher settings

**Container restarting:**
- Check `/api/health` endpoint
- Review container logs
- Verify resource limits (CPU/RAM)

## Post-Deployment Checklist

- [ ] Migrations run successfully
- [ ] Health check returns 200 OK
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Environment variables verified
- [ ] Real-time features working
- [ ] Resource limits set appropriately

## Reference Documentation

For complete deployment guide including Pusher setup, backups, and security: See [COOLIFY.md](../../../COOLIFY.md) in project root.

## Common Patterns

**Resource limits:**
| Service | CPU | Memory |
|---------|-----|--------|
| Web     | 1   | 512MB  |
| DB      | 0.5 | 256MB  |

**Database backup:**
```bash
docker exec <container> pg_dump -U <user> <db> > backup.sql
```

**Security:**
- Use strong random passwords
- Enable SSL/TLS everywhere
- Restrict Pusher allowed origins
- Regularly update base images
