#!/bin/bash

# Build Docker image for global-scroll-service
set -e

IMAGE_NAME="global-scroll-service"
TAG="${1:-latest}"

echo "Building Docker image: ${IMAGE_NAME}:${TAG}"
docker build -t "${IMAGE_NAME}:${TAG}" .

echo "Build complete: ${IMAGE_NAME}:${TAG}"
echo ""
echo "To run in production:"
echo "  1. cp .env.prod.example .env.prod"
echo "  2. Edit .env.prod with your settings"
echo "  3. docker-compose -f docker-compose.prod.yml up -d"

