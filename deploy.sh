#!/bin/bash

# VibeGrid UI Production Deploy Script (matching modelLink FE template)
set -e

if ! docker network ls | grep -q "vibegrid_net"; then
  echo "🌐 Creating docker network 'vibegrid_net'..."
  docker network create vibegrid_net
else
  echo "✅ Docker network 'vibegrid_net' already exists."
fi

echo "🚀 Starting VibeGrid UI Production Deployment..."
MAX_RETRIES=3
RETRY_COUNT=0
SUCCESS=false

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
  if docker compose -f docker-compose.yml up -d --build; then
    SUCCESS=true
    break
  else
    echo "⚠️ Docker Compose failed. Retrying in 10 seconds... ($((RETRY_COUNT + 1))/$MAX_RETRIES)"
    RETRY_COUNT=$((RETRY_COUNT + 1))
    sleep 10
  fi
done

if [ "$SUCCESS" = false ]; then
  echo "❌ Docker Compose failed after $MAX_RETRIES attempts. Stopping deployment."
  exit 1
fi
echo "✅ VibeGrid UI Production Deployment running!"
