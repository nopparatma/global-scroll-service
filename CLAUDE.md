# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Global Scroll** is a real-time collaborative application where users worldwide scroll together to increase a global height counter. The backend uses Redis for high-speed state management and PostgreSQL for persistent storage, with Socket.io handling real-time bidirectional communication.

**Core Philosophy:** "Creative Simplicity" & "Real-time Unity"

## Development Commands

### Build & Run
```bash
npm run build          # Compile TypeScript to dist/
npm run dev            # Run main server with hot reload (nodemon)
npm run worker         # Run worker process with hot reload
npm start              # Run compiled server (production)
npm run start:worker   # Run compiled worker (production)
```

### Database
```bash
npm run db:migrate     # Create and apply Prisma migrations
npm run db:push        # Push schema changes without migrations (dev)
npm run db:studio      # Open Prisma Studio (database GUI)
npx prisma generate    # Regenerate Prisma Client after schema changes
```

### Code Quality
```bash
npm run lint           # Run ESLint on src/**/*.ts
npm run format         # Format code with Prettier
```

### Docker Development
```bash
docker-compose up --build              # Start all services (app, worker, redis, postgres)
docker-compose up redis postgres -d    # Start only Redis & Postgres in background
```

## Architecture

### Two-Process Architecture
The system runs as **two separate Node.js processes**:

1. **Main Server** (`src/server.ts`):
   - Express HTTP server + Socket.io WebSocket server
   - Handles real-time client connections
   - Processes incoming scroll events from users
   - Broadcasts game state updates every 200ms via tick loop

2. **Worker Process** (`src/worker.ts`):
   - Runs background jobs independently
   - `persistence.worker.ts`: Syncs Redis state to PostgreSQL every 30s
   - `gravity.worker.ts`: Applies gravity decay when idle (checks every 1s)

### Data Flow: Hot Path vs Cold Path

**Hot Path (Real-time, Redis-based):**
1. Client sends `scroll_batch` event with scroll delta
2. `socket.controller.ts` validates and rate-limits the event
3. `game.service.ts` processes batch:
   - Anti-cheat velocity check (max 5000px/s)
   - Atomic `INCRBY` to Redis for global & country heights
   - Updates last activity timestamp
   - Calculates smoothed velocity using EMA (Exponential Moving Average)
4. Tick loop broadcasts state to all clients every 200ms
5. `milestoneManager.ts` checks if height crossed milestone thresholds

**Cold Path (Persistence, PostgreSQL-based):**
- Persistence worker reads Redis state every 30s
- Writes snapshot to `GlobalHistory` table
- Milestone flags written immediately when unlocked

### Key Services

**`redis.service.ts`**: Manages all Redis operations
- Keys: `global:height`, `global:height:{countryCode}`, `global:velocity`, `global:last_activity`
- All height operations use atomic Redis commands (INCRBY, DECRBY)

**`game.service.ts`**: Core game logic
- Anti-cheat: velocity validation, batch interval enforcement
- Velocity smoothing using Exponential Moving Average (alpha=0.3)
- Returns height as string to avoid JavaScript integer overflow (safe limit 2^53)

**`milestoneManager.ts`**: Milestone/flag system
- Tracks next milestone (starts at 1000m, increments by 1000m)
- Creates Flag records when height crosses thresholds
- Associates flags with user who triggered the milestone

**`user.service.ts`**: User management
- Find or create users by deviceId
- Uses GeoIP for country detection (fallback to 'XX' for unknown)

### Socket.io Events

**Client → Server:**
- `scroll_batch`: `{ delta: number }` (max 10,000px per batch)

**Server → Client:**
- `init`: Initial game state + user info (sent on connection)
- `tick`: Game state broadcast every 200ms with `{ height, velocity, countryHeights }`
- Heights sent as strings to prevent JavaScript integer overflow

### Anti-Cheat System

**Velocity Check**: Rejects batches with velocity > 5000px/s
**Rate Limiting**: Ignores scroll_batch events < 500ms apart
**Batch Validation**: Max 10,000px per batch (Zod schema)

### Database Schema Notes

**BigInt Usage**: All heights stored as `BigInt` in PostgreSQL to support very large numbers
- JavaScript's `Number.MAX_SAFE_INTEGER` is 2^53-1
- Heights transmitted as strings in Socket.io events
- Convert with `BigInt()` for DB operations, `.toString()` for clients

**Models:**
- `User`: Indexed by unique `deviceId`, tracks `countryCode`
- `Flag`: Milestone markers with height, userId, countryCode
- `GlobalHistory`: Height snapshots for analytics

### Environment Variables

Required environment variables (create `.env` from `.env.example`):
- `PORT`: Server port (default 3000)
- `NODE_ENV`: development | production
- `REDIS_URL`: Redis connection string
- `DATABASE_URL`: PostgreSQL connection string

### Internationalization (i18n)

- Uses `i18next` with filesystem backend
- Locale files in `locales/` directory
- Language determined by `?lang=` query parameter in handshake
- Default: English (`en`)

## Important Implementation Details

### Why Two Processes?
Separating the worker prevents background jobs (gravity, persistence) from blocking real-time Socket.io event processing. Both connect to the same Redis instance.

### Gravity Mechanism
When no user activity for >10 seconds, height decreases by 100px/second until reaching 0. This creates urgency and keeps users engaged.

### Scalability Considerations
- Client batching: Clients should accumulate scroll locally, send batches every 3-5s
- Server batching: All writes go to Redis (fast), PostgreSQL synced periodically
- For >10k users: use Socket.io Redis Adapter to scale horizontally

### GeoIP Handling
Localhost IPs (::1, 127.0.0.1) default to Thai IP (203.146.237.237) for development. Production uses actual client IP from socket handshake.
