#!/bin/sh
set -e

# Wait for database to be ready
echo "Waiting for PostgreSQL..."
until nc -z ${DB_HOST:-postgres} ${DB_PORT:-5432}; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done
echo "PostgreSQL is up"

# Wait for Redis to be ready
echo "Waiting for Redis..."
until nc -z ${REDIS_HOST:-redis} ${REDIS_PORT:-6379}; do
  echo "Redis is unavailable - sleeping"
  sleep 1
done
echo "Redis is up"

# Run Prisma migrations in production
if [ "$NODE_ENV" = "production" ]; then
  echo "Running Prisma migrations..."
  npx prisma migrate deploy
fi

# Execute the main command
exec "$@"

