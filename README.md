# Global Scroll Service

Real-time collaborative scrolling backend where users worldwide scroll together to increase a global height counter.

## Features

- Real-time WebSocket communication via Socket.io
- Redis for high-speed state management
- PostgreSQL for persistent storage with multi-tier data retention
- Anti-cheat velocity validation
- Per-country gravity decay system
- Automated data aggregation and cleanup
- RESTful API for historical data and analytics
- GeoIP-based country detection
- Internationalization (i18n) support

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Real-time:** Socket.io
- **Database:** PostgreSQL (with Prisma ORM)
- **Cache:** Redis
- **Language:** TypeScript
- **Containerization:** Docker & Docker Compose

## Prerequisites

- Docker & Docker Compose (recommended)
- Node.js 18+ (for local development without Docker)
- npm or yarn

## Setup & Run

### 1. Clone the repository

```bash
git clone <repository-url>
cd global-scroll-service
```

### 2. Environment Configuration

Create a `.env` file based on the configuration below:

```env
# Environment
NODE_ENV=development

# Server
PORT=3000
CORS_ORIGIN=*

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/globalscroll

# Redis
REDIS_URL=redis://localhost:6379

# Game Balance (optional)
GAME_DIFFICULTY_MULTIPLIER=1.0
GRAVITY_STRENGTH_MULTIPLIER=1.0
MAX_VELOCITY_MULTIPLIER=1.0

# Worker Configuration (optional)
AGGREGATION_CRON_SCHEDULE="0 3 * * *"  # Daily at 03:00 AM (cron format)
```

### 3. Start with Docker Compose (Recommended)

```bash
docker-compose up --build
```

This will start:
- **Main Server** (Port 3000) - Express + Socket.io server
- **Worker Process** - Background jobs for gravity, persistence, and aggregation
- **Redis** (Port 6379) - In-memory data store
- **PostgreSQL** (Port 5432) - Persistent database

### 4. Local Development (Without Docker)

#### Start Infrastructure

```bash
docker-compose up redis postgres -d
```

#### Install Dependencies

```bash
npm install
```

#### Setup Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npm run db:migrate

# (Optional) Open Prisma Studio to view data
npm run db:studio
```

#### Start Development Servers

Terminal 1 - Main Server:
```bash
npm run dev
```

Terminal 2 - Worker Process:
```bash
npm run worker
```

## Available Scripts

### Build & Run
```bash
npm run build          # Compile TypeScript to dist/
npm start              # Run compiled main server (production)
npm run dev            # Run main server with hot reload (nodemon)
npm run start:worker   # Run compiled worker (production)
npm run worker         # Run worker with hot reload (nodemon)
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

## Architecture

### Two-Process Architecture

1. **Main Server** (`src/server.ts`)
   - Express HTTP server + Socket.io WebSocket server
   - Handles real-time client connections
   - Processes incoming scroll events
   - Broadcasts game state updates every 200ms

2. **Worker Process** (`src/worker.ts`)
   - Runs background jobs independently
   - Prevents blocking real-time event processing
   - Shared Redis instance with main server

### Workers

- **`global-height.worker.ts`**: Calculates global height by summing all country heights (every 1 second)
- **`persistence.worker.ts`**: Syncs Redis state to PostgreSQL (every 30 seconds)
- **`gravity.worker.ts`**: Applies gravity decay to idle countries (every 1 second)
- **`aggregation.worker.ts`**: Aggregates raw data to daily summaries (configurable via cron schedule)

### Data Flow

**Hot Path (Real-time, Redis-based):**
1. Client sends `scroll_batch` event with scroll delta (pixels)
2. Server validates and converts pixels to millimeters (CSS Reference Pixel: 1px = 0.264583mm)
3. Anti-cheat: velocity check (max 2000 mm/s = 2 m/s)
4. Rate limiting: minimum 500ms between batches
5. Atomic Redis `INCRBY` for country height
6. Global height worker calculates total from all countries
7. Server broadcasts state to all clients every 200ms

**Cold Path (Persistence, PostgreSQL-based):**
1. Persistence worker reads Redis state every 30s
2. Writes to `TransactionHistoryRaw` (7-day retention)
3. Aggregation worker runs on cron schedule (default: 03:00 AM daily)
4. Converts raw data → `TransactionHistoryDaily` (infinite retention)
5. Cleans up old raw data (>7 days)

### Tech Details

**Unit System:**
- All heights stored in **millimeters** (integers for Redis compatibility)
- Client sends pixels, server converts via CSS Reference Pixel standard
- Database: BigInt for supporting very large numbers
- Socket.io: Heights transmitted as strings to prevent JavaScript integer overflow

**Gravity System:**
- Per-country gravity decay
- Activates after 5 seconds of inactivity
- Decay rate: 26 mm/s = 2.6 cm/s (configurable via `GRAVITY_STRENGTH_MULTIPLIER`)
- Global height = sum of all country heights (recalculated every 1s)

**Redis Keys:**
- `global:height` - Total global height (mm)
- `global:height:{countryCode}` - Per-country height (mm)
- `global:last_activity` - Global last activity timestamp
- `global:last_activity:{countryCode}` - Per-country last activity timestamp

## WebSocket API

### Connection

**Endpoint:** `ws://localhost:3000`

**Handshake Query Parameters:**
- `deviceId` (required): Unique device identifier
- `lang` (optional): Language code (default: `en`)
- `countryCode` (optional): Manual country override (for testing)

Example:
```javascript
const socket = io('http://localhost:3000', {
  query: {
    deviceId: 'user123',
    lang: 'en'
  }
});
```

### Events

**Client → Server:**
- `scroll_batch`: Send scroll delta
  ```javascript
  socket.emit('scroll_batch', { delta: 500 }); // pixels
  ```

**Server → Client:**
- `init`: Initial game state (sent on connection)
  ```javascript
  {
    height: "12345678",  // mm (as string)
    velocity: 123.45,     // mm/s
    countryHeights: {
      "TH": "5000000",
      "US": "3000000"
    },
    user: {
      id: "uuid",
      country: "TH"
    },
    message: "Welcome message"
  }
  ```

- `tick`: Real-time state update (every 200ms)
  ```javascript
  {
    height: "12345678",  // mm (as string)
    velocity: 123.45,     // mm/s
    countryHeights: { ... }
  }
  ```

## REST API

### Global History

**GET** `/api/history?range=1h|24h|7d|30d|1y|5y|all`
- Get historical height data for time range
- Returns array of `{ timestamp, height, velocity }`

**GET** `/api/history/stats`
- Get statistical summary
- Returns `{ peakHeight, peakDate, totalGrowth, averageGrowthPerDay, currentHeight, daysTracked }`

**GET** `/api/history/latest`
- Get current height
- Returns `{ height }`

### Country-Specific

**GET** `/api/countries/rankings`
- Get country leaderboard
- Returns sorted array of `{ countryCode, height, rank }`

**GET** `/api/countries/:countryCode/history?range=24h`
- Get historical data for specific country

**GET** `/api/countries/:countryCode/stats`
- Get statistics for specific country

**GET** `/api/countries/:countryCode/latest`
- Get current height for specific country

**POST** `/api/countries/compare`
- Compare multiple countries
- Body: `{ countryCodes: ["TH", "US"], range: "24h" }`
- Max 10 countries per request

## Database Schema

```prisma
model User {
  id          String   @id @default(uuid())
  deviceId    String   @unique
  countryCode String   @default("XX")
  username    String?
  createdAt   DateTime @default(now())
}

model TransactionHistoryRaw {
  id          Int      @id @default(autoincrement())
  countryCode String
  height      BigInt   // Height in millimeters
  recordedAt  DateTime @default(now())
  // Retention: 7 days
}

model TransactionHistoryDaily {
  id          Int      @id @default(autoincrement())
  countryCode String
  height      BigInt   // Average height in millimeters
  minHeight   BigInt   // Minimum height
  maxHeight   BigInt   // Maximum height
  sampleCount Int      // Number of samples aggregated
  recordedAt  DateTime
  // Retention: Infinite
}
```

## Configuration

### Game Balance

Adjust game difficulty via environment variables:

- `GAME_DIFFICULTY_MULTIPLIER` - Overall difficulty (default: 1.0)
- `GRAVITY_STRENGTH_MULTIPLIER` - Gravity decay speed (default: 1.0)
  - 0.5 = slower gravity (easier)
  - 2.0 = faster gravity (harder)
- `MAX_VELOCITY_MULTIPLIER` - Anti-cheat velocity limit (default: 1.0)
  - Higher = more lenient
  - Lower = stricter

### Data Retention

- **Raw data:** 7 days (30-second snapshots)
- **Daily data:** Infinite (daily aggregates)
- **Aggregation:** Configurable cron schedule (default: 03:00 AM daily)

### Worker Configuration

#### Aggregation Schedule

- `AGGREGATION_CRON_SCHEDULE` - Cron expression for aggregation job (default: `"0 3 * * *"`)

**Cron Format:**
```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday = 0)
│ │ │ │ │
* * * * *
```

**Common Examples:**

| Expression | Meaning | Run Times |
|-----------|---------|-----------|
| `"0 3 * * *"` | Daily at 03:00 AM | 03:00 |
| `"0 */6 * * *"` | Every 6 hours | 00:00, 06:00, 12:00, 18:00 |
| `"0 */12 * * *"` | Every 12 hours | 00:00, 12:00 |
| `"*/30 * * * *"` | Every 30 minutes | :00, :30 |
| `"0 0 * * 0"` | Weekly on Sunday | Sun 00:00 |
| `"0 0 1 * *"` | Monthly on 1st | 1st 00:00 |

**Use Cases:**

- **Development** (frequent testing):
  ```env
  AGGREGATION_CRON_SCHEDULE="*/5 * * * *"  # Every 5 minutes
  ```

- **Staging** (production-like):
  ```env
  AGGREGATION_CRON_SCHEDULE="0 */4 * * *"  # Every 4 hours
  ```

- **Production** (off-peak hours):
  ```env
  AGGREGATION_CRON_SCHEDULE="0 3 * * *"    # 03:00 AM daily (default)
  ```

- **High-Traffic** (prevent data overflow):
  ```env
  AGGREGATION_CRON_SCHEDULE="0 */12 * * *" # Every 12 hours
  ```

**Tools:** Use [crontab.guru](https://crontab.guru/) to generate and test cron expressions

## Development

### Testing

1. **Test Client:** Open `test-client.html` in browser
2. **Load Testing:** Run `node test-simulation.js` (requires `socket.io-client`)

### Project Structure

```
src/
├── server.ts              # Main server entry point
├── worker.ts              # Worker process entry point
├── app.ts                 # Express app configuration
├── config/                # Configuration files
│   ├── env.ts            # Environment validation
│   ├── game.constants.ts # Game constants
│   └── i18n.ts           # Internationalization
├── services/              # Business logic
│   ├── game.service.ts
│   ├── user.service.ts
│   ├── redis.service.ts
│   ├── history.service.ts
│   └── country-history.service.ts
├── workers/               # Background workers
│   ├── global-height.worker.ts
│   ├── persistence.worker.ts
│   ├── gravity.worker.ts
│   └── aggregation.worker.ts
├── sockets/               # WebSocket handlers
│   └── socket.controller.ts
├── routes/                # REST API routes
│   └── history.routes.ts
└── utils/                 # Utilities
    ├── logger.ts
    ├── prisma.ts
    └── time.helpers.ts
```

## License

ISC
