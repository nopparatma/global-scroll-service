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

**Cold Path (Persistence, PostgreSQL-based):**
- Persistence worker reads Redis state every 30s
- Writes snapshot to `TransactionHistoryRaw` table
- Daily aggregation worker creates `TransactionHistoryDaily` records

### Key Services

**`redis.service.ts`**: Manages all Redis operations
- Keys: `global:height`, `global:height:{countryCode}`, `global:velocity`, `global:last_activity`
- All height operations use atomic Redis commands (INCRBY, DECRBY)

**`game.service.ts`**: Core game logic
- Anti-cheat: velocity validation, batch interval enforcement
- Velocity smoothing using Exponential Moving Average (alpha=0.3)
- Returns height as string to avoid JavaScript integer overflow (safe limit 2^53)

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

**Velocity Check**: Rejects batches with velocity > 2000 mm/s (2 m/s, adjustable via `MAX_VELOCITY_MULTIPLIER`)
**Rate Limiting**: Ignores scroll_batch events < 500ms apart
**Batch Validation**: Max 10,000px per batch (Zod schema)

### Physics & Unit Conversion

**CSS Reference Pixel (W3C Standard):**
- All pixel-to-millimeter conversions use CSS Reference Pixel: `1 px = 1/96 inch = 0.264583 mm`
- This ensures **equal gameplay across all devices** (iPhone, Android, Desktop, etc.)
- **Physical realism**: Scrolling ~1 cm on screen = gaining ~1 cm in the game
- **Storage unit**: Millimeters (integers) for Redis & PostgreSQL compatibility
- **Example conversions:**
  - 100 px = 26 mm = 2.6 cm
  - 1000 px = 265 mm = 26.5 cm
  - 3780 px ≈ 1000 mm = 100 cm = 1 meter

**Why CSS Reference Pixel?**
- Device-independent: All users experience the same difficulty regardless of screen PPI
- Web standard: Follows W3C CSS specification
- Fair gameplay: No advantage for high-DPI or low-DPI devices

**Why Millimeters?**
- Integer values required for Redis `INCRBY`/`DECRBY` commands
- Fine-grained precision while avoiding floating-point errors
- Easy conversion: 10mm = 1cm, 1000mm = 1m

### Database Schema Notes

**BigInt Usage**: All heights stored as `BigInt` in PostgreSQL to support very large numbers
- JavaScript's `Number.MAX_SAFE_INTEGER` is 2^53-1
- Heights transmitted as strings in Socket.io events
- Convert with `BigInt()` for DB operations, `.toString()` for clients

**Models:**
- `User`: Indexed by unique `deviceId`, tracks `countryCode`
- `TransactionHistoryRaw`: Height snapshots every 30s (7-day retention)
- `TransactionHistoryDaily`: Daily aggregated height data (infinite retention)

### Environment Variables

Required environment variables:
- `PORT`: Server port (default 3000)
- `NODE_ENV`: development | production | staging | test
- `REDIS_URL`: Redis connection string
- `DATABASE_URL`: PostgreSQL connection string
- `CORS_ORIGIN`: CORS allowed origins (default: *)

**Game Balance Configuration:**
- `GAME_DIFFICULTY_MULTIPLIER`: Overall difficulty (1.0 = normal, 0.5 = easier, 2.0 = harder)
- `GRAVITY_STRENGTH_MULTIPLIER`: Gravity decay speed (1.0 = normal, 0.5 = slower, 2.0 = faster)
- `MAX_VELOCITY_MULTIPLIER`: Anti-cheat velocity limit adjustment (1.0 = normal)

**Worker Configuration:**
- `AGGREGATION_CRON_SCHEDULE`: Cron expression for data aggregation (default: "0 3 * * *")
  - Cron format: `minute hour day month weekday`
  - Example breakdown of "0 */12 * * *":
    - `0` = minute 0
    - `*/12` = every 12 hours (00:00, 12:00)
    - `*` = every day of month
    - `*` = every month
    - `*` = every day of week
  - Common patterns:
    - `"0 3 * * *"` = Daily at 03:00 AM (production default)
    - `"0 */6 * * *"` = Every 6 hours
    - `"*/5 * * * *"` = Every 5 minutes (development)
  - Use [crontab.guru](https://crontab.guru/) for testing expressions

### Internationalization (i18n)

- Uses `i18next` with filesystem backend
- Locale files in `locales/` directory
- Language determined by `?lang=` query parameter in handshake
- Default: English (`en`)

## Important Implementation Details

### Why Two Processes?
Separating the worker prevents background jobs (gravity, persistence) from blocking real-time Socket.io event processing. Both connect to the same Redis instance.

### Gravity Mechanism
When a country has no user activity for >5 seconds, height decreases by 26 mm/second = 2.6 cm/s (adjustable via `GRAVITY_STRENGTH_MULTIPLIER`) until reaching 0. This creates urgency and keeps users engaged.

**Per-Country Gravity:**
- Each country's height decays independently
- Gravity only applies to idle countries (>5s since last scroll)
- Decay rate: 26 mm/tick (integer value for Redis compatibility)
- Global height is recalculated every second as sum of all country heights

### Scalability Considerations
- Client batching: Clients should accumulate scroll locally, send batches every 3-5s
- Server batching: All writes go to Redis (fast), PostgreSQL synced periodically
- For >10k users: use Socket.io Redis Adapter to scale horizontally

### GeoIP Handling
Localhost IPs (::1, 127.0.0.1) default to Thai IP (203.146.237.237) for development. Production uses actual client IP from socket handshake.
