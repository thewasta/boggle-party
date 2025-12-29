# Docker Development Guide

This document explains how to use Docker for local development of Boggle Party.

## Prerequisites

- Docker Desktop or Docker Engine installed
- Docker Compose v2+

## Quick Start

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f web

# Stop services
docker compose down
```

## Services

### Web Service
- **URL:** http://localhost:3000
- **Health Check:** http://localhost:3000/api/health
- **Hot Reload:** Enabled (changes in src/ automatically reload)

### Database Service
- **Host:** localhost
- **Port:** 5432
- **Database:** boggle_party
- **User:** boggle_user
- **Password:** dev_password_change_me (from .env.local)

## Common Commands

### Development
```bash
# Start services
docker compose up -d

# Rebuild web service (after dependency changes)
docker compose up -d --build web

# View logs
docker compose logs -f web

# View logs for both services
docker compose logs -f

# Stop services
docker compose down
```

### Database Management
```bash
# Access PostgreSQL directly
docker compose exec db psql -U boggle_user -d boggle_party

# Run SQL file
docker compose exec -T db psql -U boggle_user -d boggle_party < backup.sql

# Backup database
docker compose exec db pg_dump -U boggle_user boggle_party > backup.sql

# Restore database
docker compose exec -T db psql -U boggle_user -d boggle_party < backup.sql
```

### Troubleshooting
```bash
# Check container status
docker compose ps

# Restart specific service
docker compose restart web

# Restart all services
docker compose restart

# Clean slate (remove volumes - deletes all data!)
docker compose down -v
docker compose up -d --build

# View resource usage
docker stats
```

## Environment Variables

Copy `.env.example` to `.env.local` and update values:

```bash
cp .env.example .env.local
```

Required variables:
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` - Database configuration
- `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER` - Pusher credentials

## Volume Persistence

PostgreSQL data is stored in Docker named volume `postgres_data`. Data persists between container restarts.

To completely reset (delete all data):
```bash
docker compose down -v
```

## Production Build

Production uses multi-stage Dockerfile (not Dockerfile.dev):

```bash
# Build production image
docker build -f Dockerfile -t boggle-party:prod .

# Run production container
docker run -p 3000:3000 --env-file .env.local boggle-party:prod
```

## Troubleshooting Tips

### Port already in use
If port 3000 is already in use:
```bash
# Find process using port 3000
lsof -i :3000

# Or change port in docker-compose.yml
ports:
  - "3001:3000"
```

### Database connection errors
1. Check database is healthy: `docker compose ps`
2. Check environment variables in `.env.local`
3. Verify DATABASE_URL matches docker-compose db credentials
4. Check database logs: `docker compose logs db`

### Hot reload not working
1. Verify volume mounts in docker-compose.yml
2. Check file is not in .dockerignore
3. Restart web service: `docker compose restart web`
