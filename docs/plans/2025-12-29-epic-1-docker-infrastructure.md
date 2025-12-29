# Epic 1: Project Foundation & Infrastructure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Set up Docker development environment with Next.js and PostgreSQL services, install required dependencies, configure environment variables, and prepare the Spanish dictionary for word validation.

**Architecture:** Multi-container Docker setup with Next.js 16 application (web service) and PostgreSQL 16 (db service). Web service depends on db, with hot reload in development. PostgreSQL data persisted via named volume. Services communicate via Docker network, with web accessing db at hostname `db:5432`.

**Tech Stack:** Docker, Docker Compose, PostgreSQL 16-alpine, Next.js 16, Pusher Channels, Zod (validation), nanoid (ID generation), pg (PostgreSQL client)

---

## Task 1: Install Required Dependencies

**Files:**
- Modify: `package.json` (via pnpm add)

**Step 1: Install Pusher server and client dependencies**

Run: `pnpm add pusher pusher-js`
Expected: Packages added to dependencies in package.json, node_modules updated

**Step 2: Install validation and utility dependencies**

Run: `pnpm add zod nanoid pg`
Expected: zod, nanoid, and pg added to dependencies

**Step 3: Install TypeScript type for pusher-js**

Run: `pnpm add -D @types/pusher-js`
Expected: @types/pusher-js added to devDependencies

**Step 4: Verify installation**

Run: `pnpm list pusher pusher-js zod nanoid pg @types/pusher-js`
Expected: All packages listed with versions

**Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "feat: install Pusher, Zod, nanoid, and PostgreSQL dependencies

- Add pusher and pusher-js for real-time communication
- Add zod for schema validation
- Add nanoid for unique ID generation
- Add pg for PostgreSQL database access
- Add @types/pusher-js for TypeScript support"
```

---

## Task 2: Create .dockerignore File

**Files:**
- Create: `.dockerignore`

**Step 1: Create .dockerignore to exclude unnecessary files from Docker build**

Create file with:

```dockerignore
# Dependencies
node_modules
.pnpm-store

# Next.js build output
.next
out

# Environment files (will be injected in container)
.env.local
.env*.local

# Development files
.git
.gitignore
README.md
CLAUDE.md
docs

# IDE
.vscode
.idea

# Testing
coverage
.nyc_output

# Misc
*.log
.DS_Store
```

**Step 2: Verify .dockerignore was created**

Run: `cat .dockerignore`
Expected: Contents shown above

**Step 3: Commit**

```bash
git add .dockerignore
git commit -m "chore: add .dockerignore to exclude unnecessary files from Docker build

Excludes node_modules, .next, local env files, and development artifacts"
```

---

## Task 3: Create Multi-Stage Dockerfile

**Files:**
- Create: `Dockerfile`

**Step 1: Create Dockerfile for Next.js with multi-stage build**

Create file with:

```dockerfile
# Base image with Node.js and pnpm
FROM node:20-alpine AS base
RUN corepack enable pnpm && corepack prepare pnpm@latest --activate

# Dependencies stage
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Builder stage
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Build Next.js application
RUN pnpm build

# Production stage (minimal image)
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set correct permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

**Step 2: Verify Dockerfile syntax**

Run: `docker build --check -f Dockerfile .`
Expected: No syntax errors

**Step 3: Commit**

```bash
git add Dockerfile
git commit -m "feat: add multi-stage Dockerfile for Next.js production builds

- Uses Node.js 20 Alpine with pnpm
- Separate stages: deps, builder, runner
- Runs as non-root nextjs user
- Optimized for production with standalone output"
```

---

## Task 4: Create Development Dockerfile

**Files:**
- Create: `Dockerfile.dev`

**Step 1: Create Dockerfile.dev for development with hot reload**

Create file with:

```dockerfile
FROM node:20-alpine

# Enable pnpm
RUN corepack enable pnpm && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install

# Copy source code
COPY . .

# Expose development port
EXPOSE 3000

# Start development server with hot reload
CMD ["pnpm", "dev"]
```

**Step 2: Verify Dockerfile.dev syntax**

Run: `docker build --check -f Dockerfile.dev .`
Expected: No syntax errors

**Step 3: Commit**

```bash
git add Dockerfile.dev
git commit -m "feat: add development Dockerfile with hot reload support

Uses pnpm and runs next dev for development with hot module replacement"
```

---

## Task 5: Update next.config.ts for Standalone Output

**Files:**
- Modify: `next.config.ts`

**Step 1: Read current next.config.ts**

Run: `cat next.config.ts`
Expected: See current configuration

**Step 2: Add output: 'standalone' for Docker production**

Edit the config file to include standalone output:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: 'standalone', // Enable for Docker production builds
};

export default nextConfig;
```

**Step 3: Verify TypeScript is valid**

Run: `pnpm build`
Expected: Build completes successfully (or fails due to missing .env, but config is valid)

**Step 4: Commit**

```bash
git add next.config.ts
git commit -m "feat: enable standalone output for Docker production

Configures Next.js to output standalone build for optimized Docker images"
```

---

## Task 6: Create docker-compose.yml

**Files:**
- Create: `docker-compose.yml`

**Step 1: Create docker-compose.yml with web and db services**

Create file with:

```yaml
services:
  web:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    env_file:
      - .env.local
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - .:/app
      - /app/node_modules
      - /app/.next
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    container_name: boggle_postgres
    environment:
      POSTGRES_DB: boggle_party
      POSTGRES_USER: boggle_user
      POSTGRES_PASSWORD: dev_password_change_me
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U boggle_user -d boggle_party"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  postgres_data:
```

**Step 2: Verify docker-compose syntax**

Run: `docker compose config`
Expected: Valid YAML output showing both services

**Step 3: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: add Docker Compose configuration with web and db services

- Web service: Next.js dev server with hot reload
- DB service: PostgreSQL 16 Alpine with health checks
- Named volume for PostgreSQL data persistence
- Proper service dependencies and restart policies"
```

---

## Task 7: Create .env.example Template

**Files:**
- Create: `.env.example`

**Step 1: Create .env.example with all required variables**

Create file with:

```env
# Database Configuration
POSTGRES_DB=boggle_party
POSTGRES_USER=boggle_user
POSTGRES_PASSWORD=CHANGE_THIS_PASSWORD
DATABASE_URL=postgresql://boggle_user:CHANGE_THIS_PASSWORD@db:5432/boggle_party

# Pusher Configuration
PUSHER_APP_ID=your_pusher_app_id
PUSHER_KEY=your_pusher_key
PUSHER_SECRET=your_pusher_secret
PUSHER_CLUSTER=your_pusher_cluster
PUSHER_USE_TLS=true
NEXT_PUBLIC_PUSHER_KEY=your_pusher_key
NEXT_PUBLIC_PUSHER_CLUSTER=your_pusher_cluster
```

**Step 2: Verify .env.example was created**

Run: `cat .env.example`
Expected: All environment variables shown

**Step 3: Commit**

```bash
git add .env.example
git commit -m "chore: add environment variables template

Includes database and Pusher configuration with placeholder values"
```

---

## Task 8: Create .env.local for Local Development

**Files:**
- Create: `.env.local`

**Step 1: Create .env.local with development defaults**

Create file with:

```env
# Database Configuration (Development)
POSTGRES_DB=boggle_party
POSTGRES_USER=boggle_user
POSTGRES_PASSWORD=dev_password_change_me
DATABASE_URL=postgresql://boggle_user:dev_password_change_me@db:5432/boggle_party

# Pusher Configuration
# TODO: Sign up at https://pusher.com/ and replace these values
PUSHER_APP_ID=123456
PUSHER_KEY=your_key_here
PUSHER_SECRET=your_secret_here
PUSHER_CLUSTER=your_cluster_here
PUSHER_USE_TLS=true
NEXT_PUBLIC_PUSHER_KEY=your_key_here
NEXT_PUBLIC_PUSHER_CLUSTER=your_cluster_here
```

**Step 2: Verify .env.local was created and is gitignored**

Run: `cat .env.local && git check-ignore .env.local`
Expected: File contents shown, then ".env.local" indicating it's ignored

**Step 3: Verify .gitignore includes .env.local**

Run: `grep ".env.local" .gitignore`
Expected: Pattern found in .gitignore

**Step 4: Do NOT commit .env.local (it contains sensitive placeholders)**

Note: This file should already be gitignored, so it won't be committed

---

## Task 9: Create data Directory and Download Spanish Dictionary

**Files:**
- Create: `data/dictionary.json`

**Step 1: Create data directory**

Run: `mkdir -p data`
Expected: Directory created

**Step 2: Download Spanish dictionary from npm package**

Run: `pnpm add an-array-of-spanish-words`
Expected: Package added to node_modules

**Step 3: Copy dictionary to data directory**

Create script `scripts/copy-dictionary.js`:

```javascript
const fs = require('fs');
const path = require('path');
const dictionary = require('an-array-of-spanish-words');

const outputPath = path.resolve(__dirname, '../data/dictionary.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(dictionary, null, 2));

console.log(`Dictionary copied to ${outputPath}`);
console.log(`Total words: ${dictionary.length}`);
```

**Step 4: Run the dictionary copy script**

Run: `node scripts/copy-dictionary.js`
Expected: Message "Dictionary copied to /app/data/dictionary.json" with word count

**Step 5: Verify dictionary file exists and has content**

Run: `ls -lh data/dictionary.json && head -c 100 data/dictionary.json`
Expected: File shown (~7.9MB) with JSON array start

**Step 6: Clean up temporary dependency**

Run: `pnpm remove an-array-of-spanish-words`
Expected: Package removed from dependencies

**Step 7: Create README for data directory**

Create `data/README.md`:

```markdown
# Data Directory

This directory contains static data files used by the application.

## dictionary.json

Spanish dictionary for word validation in Boggle game.
- Source: an-array-of-spanish-words npm package
- Size: ~7.9MB
- Format: JSON array of Spanish words
- Usage: Loaded into server memory on startup for O(1) word lookup

**Do not modify this file manually.**
```

**Step 8: Commit dictionary and documentation**

```bash
git add data/dictionary.json data/README.md scripts/copy-dictionary.js
git commit -m "feat: add Spanish dictionary for word validation

- Download Spanish words dictionary (7.9MB)
- Place in data/dictionary.json for server-side loading
- Add script to regenerate from npm package
- Add documentation for data directory"
```

---

## Task 10: Update .gitignore for Data Directory

**Files:**
- Modify: `.gitignore`

**Step 1: Read current .gitignore**

Run: `cat .gitignore`
Expected: See current ignore patterns

**Step 2: Add data/ directory exception (we DO want to commit dictionary.json)**

If .gitignore contains `data/` or similar, remove it. The dictionary.json should be committed.

Add or update:

```gitignore
# Dependencies
node_modules
.pnpm-store

# Next.js
.next
out

# Environment
.env.local
.env*.local

# Keep data directory but exclude temporary data files
data/*.tmp
data/temp/

# IDE
.vscode
.idea

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
```

**Step 3: Verify dictionary.json is tracked**

Run: `git status data/dictionary.json`
Expected: Shows "modified" or "new file" but not "untracked"

**Step 4: Commit .gitignore updates**

```bash
git add .gitignore
git commit -m "chore: update .gitignore to track dictionary.json

Ensure Spanish dictionary is committed while excluding temp files"
```

---

## Task 11: Create Health Check API Endpoint

**Files:**
- Create: `src/app/api/health/route.ts`

**Step 1: Create health check endpoint for Docker**

Create file with:

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
}
```

**Step 2: Test health endpoint (requires dev server running)**

Note: We'll test this after Docker containers are running

**Step 3: Commit**

```bash
git add src/app/api/health/route.ts
git commit -m "feat: add health check API endpoint

Returns service status, timestamp, uptime, and environment for Docker health checks"
```

---

## Task 12: Create Database Connection Test Utility

**Files:**
- Create: `server/db/connection.ts`

**Step 1: Create directory structure**

Run: `mkdir -p server/db`
Expected: Directory created

**Step 2: Create database connection utility**

Create file with:

```typescript
import { Pool } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection fails
    });

    // Listen for errors on the pool
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });
  }

  return pool;
}

export async function testConnection(): Promise<boolean> {
  try {
    const pool = getPool();
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
```

**Step 3: Commit**

```bash
git add server/db/connection.ts
git commit -m "feat: add PostgreSQL connection pool utility

- Singleton pattern for connection pooling
- Connection testing function
- Proper error handling and cleanup
- Configured for Docker environment"
```

---

## Task 13: Add Database Connection Check to Health Endpoint

**Files:**
- Modify: `src/app/api/health/route.ts`

**Step 1: Read current health endpoint**

Run: `cat src/app/api/health/route.ts`
Expected: See current implementation

**Step 2: Update to include database health check**

Replace with:

```typescript
import { NextResponse } from 'next/server';
import { testConnection } from '@/server/db/connection';

export async function GET() {
  const dbHealthy = await testConnection();

  return NextResponse.json({
    status: dbHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: dbHealthy ? 'up' : 'down',
    },
  }, {
    status: dbHealthy ? 200 : 503,
  });
}
```

**Step 3: Commit**

```bash
git add src/app/api/health/route.ts
git commit -m "feat: add database health check to health endpoint

Checks PostgreSQL connection and returns 503 if database is unavailable"
```

---

## Task 14: Build and Start Docker Containers

**Step 1: Build Docker images**

Run: `docker compose build`
Expected: Docker images built successfully for web and db services

**Step 2: Start containers in detached mode**

Run: `docker compose up -d`
Expected: Containers started, "boggle_postgres" container shown

**Step 3: Verify containers are running**

Run: `docker compose ps`
Expected:
- web: running (or restarting during startup)
- db: running (healthy)

**Step 4: View web service logs**

Run: `docker compose logs -f web`
Expected: Next.js dev server starting, ready on port 3000
Press Ctrl+C to exit logs

**Step 5: Verify database is healthy**

Run: `docker compose ps db`
Expected: Status shows "healthy"

**Step 6: Test web service health endpoint**

Run: `curl http://localhost:3000/api/health`
Expected: JSON response with status "healthy" and database "up"

**Step 7: Test database connection directly**

Run: `docker compose exec db psql -U boggle_user -d boggle_party -c "SELECT version();"`
Expected: PostgreSQL version output

**Step 8: Test volume persistence**

Run:
```bash
docker compose exec db psql -U boggle_user -d boggle_party -c "CREATE TABLE test_persistence (id SERIAL PRIMARY KEY, data TEXT);"
docker compose exec db psql -U boggle_user -d boggle_party -c "INSERT INTO test_persistence (data) VALUES ('test-data');"
docker compose restart db
sleep 5
docker compose exec db psql -U boggle_user -d boggle_party -c "SELECT * FROM test_persistence;"
```
Expected: Table and data persist after restart

**Step 9: Test hot reload by modifying a page**

Run:
```bash
echo "console.log('hot reload test');" >> src/app/page.tsx
docker compose logs -f web --tail=5
```
Expected: Log shows "compiled" message indicating hot reload worked

**Step 10: Clean up test table**

Run: `docker compose exec db psql -U boggle_user -d boggle_party -c "DROP TABLE test_persistence;"`
Expected: Table dropped successfully

---

## Task 15: Create Docker Commands Documentation

**Files:**
- Create: `DOCKER.md`

**Step 1: Create comprehensive Docker documentation**

Create file with:

```markdown
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
```

**Step 2: Commit documentation**

```bash
git add DOCKER.md
git commit -m "docs: add comprehensive Docker development guide

Includes commands for starting, stopping, rebuilding, database management, and troubleshooting"
```

---

## Task 16: Create Setup Script for Initial Project Setup

**Files:**
- Create: `scripts/setup.sh`

**Step 1: Create setup script**

Create file with:

```bash
#!/bin/bash
set -e

echo "🎲 Boggle Party - Initial Setup"
echo "================================"

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "📝 Creating .env.local from template..."
  cp .env.example .env.local
  echo "⚠️  IMPORTANT: Edit .env.local and add your Pusher credentials!"
  echo "   Sign up at https://pusher.com/"
else
  echo "✅ .env.local already exists"
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker Desktop."
  exit 1
fi

echo "✅ Docker is running"

# Create data directory if needed
if [ ! -d "data" ]; then
  echo "📁 Creating data directory..."
  mkdir -p data
fi

# Copy dictionary if it doesn't exist
if [ ! -f "data/dictionary.json" ]; then
  echo "📚 Downloading Spanish dictionary..."
  pnpm add an-array-of-spanish-words
  node scripts/copy-dictionary.js
  pnpm remove an-array-of-spanish-words
else
  echo "✅ Dictionary already exists"
fi

# Build Docker images
echo "🐳 Building Docker images..."
docker compose build

# Start containers
echo "🚀 Starting Docker containers..."
docker compose up -d

# Wait for database to be healthy
echo "⏳ Waiting for database to be ready..."
timeout 60 bash -c 'until docker compose exec -T db pg_isready -U boggle_user -d boggle_party; do sleep 2; done'

echo "✅ Database is ready!"

# Check services
echo ""
echo "📊 Service Status:"
docker compose ps

echo ""
echo "✅ Setup complete!"
echo ""
echo "🌐 Application: http://localhost:3000"
echo "🏥 Health Check: http://localhost:3000/api/health"
echo "📝 View logs: docker compose logs -f"
echo ""
echo "⚠️  Don't forget to configure Pusher credentials in .env.local!"
```

**Step 2: Make script executable**

Run: `chmod +x scripts/setup.sh`
Expected: Script is now executable

**Step 3: Commit**

```bash
git add scripts/setup.sh
git commit -m "feat: add initial setup script

Automates environment setup, dictionary download, and Docker container startup"
```

---

## Task 17: Final Verification and Testing

**Step 1: Stop all containers**

Run: `docker compose down -v`
Expected: Containers stopped and volumes removed

**Step 2: Run setup script**

Run: `./scripts/setup.sh`
Expected: Script completes successfully, all services running

**Step 3: Verify all success criteria**

Run tests:

```bash
# Test 1: Web service accessible
curl -f http://localhost:3000/api/health || exit 1

# Test 2: Database accepts connections
docker compose exec db pg_isready -U boggle_user -d boggle_party || exit 1

# Test 3: Dictionary loads
[ -f data/dictionary.json ] && echo "Dictionary exists" || exit 1

# Test 4: Environment variables in container
docker compose exec web printenv | grep DATABASE_URL || exit 1
docker compose exec web printenv | grep PUSHER_KEY || exit 1

# Test 5: Hot reload (manual test)
echo "# Hot reload test - modify src/app/page.tsx and verify browser updates"
```

Expected: All tests pass

**Step 4: Check application in browser**

Open: http://localhost:3000
Expected: Next.js welcome page or application

**Step 5: Verify Pusher credentials are configured**

Run: `cat .env.local | grep your_`
Expected: If placeholder values found, display warning to configure Pusher

**Step 6: Create final verification summary**

Create `scripts/verify-setup.sh`:

```bash
#!/bin/bash

echo "🔍 Boggle Party - Setup Verification"
echo "===================================="
echo ""

# Check Docker
echo "🐳 Docker Status:"
if docker info > /dev/null 2>&1; then
  echo "✅ Docker is running"
else
  echo "❌ Docker is not running"
  exit 1
fi

# Check containers
echo ""
echo "📦 Containers:"
docker compose ps

# Check health endpoint
echo ""
echo "🏥 Health Check:"
HEALTH=$(curl -s http://localhost:3000/api/health)
if echo "$HEALTH" | grep -q "healthy"; then
  echo "✅ Web service is healthy"
  echo "$HEALTH" | jq '.' 2>/dev/null || echo "$HEALTH"
else
  echo "❌ Web service health check failed"
  exit 1
fi

# Check database
echo ""
echo "🗄️  Database:"
if docker compose exec -T db pg_isready -U boggle_user -d boggle_party > /dev/null 2>&1; then
  echo "✅ Database is accepting connections"
else
  echo "❌ Database is not ready"
  exit 1
fi

# Check dictionary
echo ""
echo "📚 Dictionary:"
if [ -f data/dictionary.json ]; then
  SIZE=$(du -h data/dictionary.json | cut -f1)
  WORDS=$(cat data/dictionary.json | jq '. | length')
  echo "✅ Dictionary exists ($SIZE, $WORDS words)"
else
  echo "❌ Dictionary not found"
  exit 1
fi

# Check environment
echo ""
echo "🔐 Environment:"
if grep -q "your_" .env.local 2>/dev/null; then
  echo "⚠️  Pusher credentials not configured (still using placeholders)"
  echo "   Edit .env.local and add your Pusher credentials"
else
  echo "✅ Environment variables configured"
fi

echo ""
echo "✅ All checks passed! Ready for development."
echo ""
echo "🌐 Application: http://localhost:3000"
echo "📖 Documentation: DOCKER.md"
```

**Step 7: Make verification script executable**

Run: `chmod +x scripts/verify-setup.sh`

**Step 8: Run verification script**

Run: `./scripts/verify-setup.sh`
Expected: All checks pass

**Step 9: Commit verification script**

```bash
git add scripts/verify-setup.sh
git commit -m "test: add setup verification script

Checks Docker, containers, health endpoint, database, dictionary, and environment configuration"
```

**Step 10: Final commit with milestone marker**

```bash
git commit --allow-empty -m "milestone: Epic 1 complete - Docker Infrastructure

✅ Docker environment with web and db services
✅ Multi-stage Dockerfile for production
✅ Development Dockerfile with hot reload
✅ PostgreSQL with volume persistence
✅ Health check endpoint
✅ Database connection utility
✅ Spanish dictionary (7.9MB)
✅ Environment configuration templates
✅ Setup and verification scripts
✅ Comprehensive documentation

Next Epic Trigger: Infrastructure validated, Docker environment running, database accessible"
```

---

## Success Criteria Verification

At the end of this epic, you should have:

- ✅ `docker compose up -d` starts both web and db services
- ✅ Web service accessible at http://localhost:3000
- ✅ Database service accepts connections on port 5432
- ✅ PostgreSQL volume persists data between container restarts
- ✅ `pnpm dev` runs without errors in container
- ✅ Dictionary file loads successfully
- ✅ Pusher credentials are accessible in environment
- ✅ Hot reload works in development mode

## Testing Summary

- ✅ Web service health endpoint responds
- ✅ Database connection from web container works
- ✅ Volume persistence verified (data survives restart)
- ✅ Environment variables injected correctly
- ✅ Hot reload works on file changes

## Files Created/Modified

**Created:**
- `.dockerignore`
- `Dockerfile` (production)
- `Dockerfile.dev` (development)
- `docker-compose.yml`
- `.env.example`
- `.env.local` (gitignored)
- `data/dictionary.json`
- `data/README.md`
- `DOCKER.md`
- `scripts/copy-dictionary.js`
- `scripts/setup.sh`
- `scripts/verify-setup.sh`
- `server/db/connection.ts`
- `src/app/api/health/route.ts`

**Modified:**
- `package.json` (added dependencies)
- `next.config.ts` (added standalone output)
- `.gitignore` (updated patterns)

---

## Next Steps

After completing Epic 1, proceed to **Epic 2: Database Schema & Persistent Data Layer** to:
- Design database schema for games, players, and words
- Create migration system
- Implement repository pattern for data access

**Epic 2 Prerequisites:** All Epic 1 deliverables complete and verified.

---

**End of Implementation Plan**
