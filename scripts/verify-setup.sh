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
