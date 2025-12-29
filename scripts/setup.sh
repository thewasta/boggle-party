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
