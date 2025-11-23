# 🚀 How to Run Global Scroll Service

This guide will help you get the Global Scroll Service up and running on your local machine.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js 18+** (you have v23.11.0 ✅)
- **Docker & Docker Compose** (for running PostgreSQL and Redis)
- **npm** (comes with Node.js)

## Quick Start (Recommended)

### Option 1: Run Everything with Docker Compose

This is the easiest way to get started. Docker Compose will start the Node.js app, PostgreSQL, and Redis all together.

```bash
# 1. Start all services
docker-compose up --build

# The app will be available at http://localhost:3000
# WebSocket endpoint: ws://localhost:3000
```

That's it! Everything will be running.

To stop:
```bash
# Press Ctrl+C, then run:
docker-compose down
```

---

### Option 2: Local Development (Recommended for Active Development)

This approach runs PostgreSQL and Redis in Docker, but runs the Node.js app locally for faster development.

#### Step 1: Start Database Services

```bash
# Start only PostgreSQL and Redis in the background
docker-compose up redis postgres -d
```

#### Step 2: Install Dependencies

```bash
# Install all npm packages
npm install
```

#### Step 3: Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# The .env file is already configured with correct local development values
```

Your `.env` should contain:
```env
NODE_ENV=development
PORT=3000
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/globalscroll?schema=public
LOG_LEVEL=info
```

#### Step 4: Set Up the Database

```bash
# Generate Prisma Client
npx prisma generate

# Push the schema to the database (creates tables)
npm run db:push

# OR run migrations (if you want to track migration history)
npm run db:migrate
```

#### Step 5: Start the Development Server

```bash
# Start the app with hot-reload
npm run dev
```

The server will start on **http://localhost:3000** 🎉

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot-reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm start` | Run production build |
| `npm run db:push` | Push schema changes to database |
| `npm run db:migrate` | Run database migrations |
| `npm run db:studio` | Open Prisma Studio (database GUI) |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

---

## Testing the Application

### Using WebSocket Client

Once the server is running, you can connect to it via WebSocket:

**Endpoint:** `ws://localhost:3000`

**Connection with Query Parameters:**
```
ws://localhost:3000?deviceId=YOUR_DEVICE_ID&lang=en
```

### Socket.io Events

**Client → Server:**
- `scroll_batch`: Send scroll data
  ```json
  { "delta": 100 }
  ```

**Server → Client:**
- `tick`: Receive global scroll state updates
  ```json
  {
    "height": 12345,
    "velocity": 10.5,
    "countryHeights": { "US": 5000, "TH": 3000 }
  }
  ```

---

## Project Structure

```
global-scroll-service/
├── src/
│   ├── config/          # Configuration files (env, i18n)
│   ├── services/        # Business logic services
│   ├── sockets/         # Socket.io controllers
│   ├── workers/         # Background workers
│   ├── utils/           # Utility functions
│   ├── locales/         # Translation files
│   └── server.ts        # Main entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── docker-compose.yml   # Docker services configuration
└── package.json         # Dependencies and scripts
```

---

## Troubleshooting

### Port Already in Use

If you get an error that port 3000, 5432, or 6379 is already in use:

```bash
# Find and kill the process using the port (example for port 3000)
lsof -ti:3000 | xargs kill -9

# Or change the port in .env file
PORT=3001
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps

# Restart database services
docker-compose restart postgres redis

# View logs
docker-compose logs postgres
```

### Prisma Issues

```bash
# Regenerate Prisma Client
npx prisma generate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# View database in browser
npm run db:studio
```

### Clear Everything and Start Fresh

```bash
# Stop all containers
docker-compose down -v

# Remove node_modules
rm -rf node_modules

# Reinstall
npm install

# Start fresh
docker-compose up --build
```

---

## Architecture Overview

- **Express + Socket.io**: Real-time WebSocket server
- **PostgreSQL**: Persistent storage for users and flags
- **Redis**: High-speed counter and state management
- **Prisma**: Type-safe database ORM
- **Workers**:
  - `gravity.worker`: Applies gravity decay to scroll velocity
  - `persistence.worker`: Syncs Redis state to PostgreSQL

---

## Next Steps

1. ✅ Get the server running
2. 📱 Build a client application to connect to the WebSocket
3. 🌍 Test with multiple devices/users
4. 🎮 Explore the gamification features
5. 🌐 Add more translations in `src/locales/`

---

## Need Help?

- Check the logs: `docker-compose logs -f app`
- View database: `npm run db:studio`
- Check Redis: `docker exec -it <redis-container-id> redis-cli`

Happy coding! 🚀
