# Implementation Plan - Global Scroll Backend

## Goal Description
Initialize and build the backend for "Global Scroll", a real-time collaborative scrolling game. The system will use Node.js, Socket.io, and Redis to handle high-concurrency state (global height, velocity) and broadcast updates to clients.

## User Review Required
> [!IMPORTANT]
> **Database Selection**: I am defaulting to **PostgreSQL** for persistent storage (Flags, History) as it pairs well with Node.js and flexible schemas.
> **Redis Dependency**: This plan assumes a local Redis instance is available or will be mocked for development.

## Proposed Changes

### Project Setup
#### [NEW] [package.json](file:///Users/nopparat/iCloud%20Drive%20%28Archive%29/Documents/SourceCode/global-scroll-service/package.json)
- Initialize project with `npm init`.
- Dependencies: `express`, `socket.io`, `redis`, `pg`, `@prisma/client`, `dotenv`, `cors`, `helmet`, `winston`, `envalid`, `zod`, `express-rate-limit`, `i18next`, `i18next-fs-backend`, `geoip-lite`.
- Dev Dependencies: `typescript`, `ts-node`, `nodemon`, `prisma`, `@types/*`, `eslint`, `prettier`, `@types/geoip-lite`.

#### [NEW] [tsconfig.json](file:///Users/nopparat/iCloud%20Drive%20%28Archive%29/Documents/SourceCode/global-scroll-service/tsconfig.json)
- Strict TypeScript configuration (`strict: true`).

#### [NEW] [Dockerfile](file:///Users/nopparat/iCloud%20Drive%20%28Archive%29/Documents/SourceCode/global-scroll-service/Dockerfile)
- Multi-stage build (Builder vs Runner) for optimized image size.
- Non-root user for security.
- Copy `locales` folder.

#### [NEW] [docker-compose.yml](file:///Users/nopparat/iCloud%20Drive%20%28Archive%29/Documents/SourceCode/global-scroll-service/docker-compose.yml)
- Services: `app`, `redis`, `postgres`.
- Healthchecks for dependent services.

### Core Server & Architecture
#### [NEW] [src/app.ts](file:///Users/nopparat/iCloud%20Drive%20%28Archive%29/Documents/SourceCode/global-scroll-service/src/app.ts)
- App setup.
- **Security Middleware**: `helmet` (Headers), `cors` (Strict Origin), `express-rate-limit` (DDoS protection).
- **Trust Proxy**: Enable for correct IP detection.

#### [NEW] [src/server.ts](file:///Users/nopparat/iCloud%20Drive%20%28Archive%29/Documents/SourceCode/global-scroll-service/src/server.ts)
- Entry point.
- Graceful shutdown handling (SIGTERM/SIGINT).
- Initialize Socket.io with **Security Options** (transports, allowRequest).
- Initialize **i18n Service**.

#### [NEW] [src/config/config.ts](file:///Users/nopparat/iCloud%20Drive%20%28Archive%29/Documents/SourceCode/global-scroll-service/src/config/config.ts)
- Validated environment variables using `envalid`.

#### [NEW] [src/utils/logger.ts](file:///Users/nopparat/iCloud%20Drive%20%28Archive%29/Documents/SourceCode/global-scroll-service/src/utils/logger.ts)
- Structured logging using `winston`.

#### [NEW] [src/config/i18n.ts](file:///Users/nopparat/iCloud%20Drive%20%28Archive%29/Documents/SourceCode/global-scroll-service/src/config/i18n.ts)
- **i18next Configuration**:
    - Supported languages: `['en', 'th']`.
    - Fallback: `en`.
    - Backend: Load from `src/locales`.

#### [NEW] [src/locales/en/translation.json](file:///Users/nopparat/iCloud%20Drive%20%28Archive%29/Documents/SourceCode/global-scroll-service/src/locales/en/translation.json)
- English translations (System messages, Errors).

#### [NEW] [src/locales/th/translation.json](file:///Users/nopparat/iCloud%20Drive%20%28Archive%29/Documents/SourceCode/global-scroll-service/src/locales/th/translation.json)
- Thai translations.

### Game Logic & State Management (Service Layer)
#### [NEW] [src/services/redis.service.ts](file:///Users/nopparat/iCloud%20Drive%20%28Archive%29/Documents/SourceCode/global-scroll-service/src/services/redis.service.ts)
- Redis client wrapper with error handling and reconnection logic.
- `incrementCountryHeight(countryCode, amount)`

#### [NEW] [src/services/game.service.ts](file:///Users/nopparat/iCloud%20Drive%20%28Archive%29/Documents/SourceCode/global-scroll-service/src/services/game.service.ts)
- Core business logic: `processScrollBatch`, `getGameState`.
- Decoupled from Socket.io (pure logic).
- **BigInt Support**: Handle all height calculations as BigInt.

#### [NEW] [src/services/user.service.ts](file:///Users/nopparat/iCloud%20Drive%20%28Archive%29/Documents/SourceCode/global-scroll-service/src/services/user.service.ts)
- `findOrCreateByDeviceId(deviceId, countryCode)`: Returns User record.

#### [NEW] [src/workers/persistence.worker.ts](file:///Users/nopparat/iCloud%20Drive%20%28Archive%29/Documents/SourceCode/global-scroll-service/src/workers/persistence.worker.ts)
- Background job for syncing Redis -> Postgres.

#### [NEW] [src/workers/gravity.worker.ts](file:///Users/nopparat/iCloud%20Drive%20%28Archive%29/Documents/SourceCode/global-scroll-service/src/workers/gravity.worker.ts)
- Background job for gravity mechanics.

### Socket.io Layer (Controller)
#### [NEW] [src/sockets/socket.controller.ts](file:///Users/nopparat/iCloud%20Drive%20%28Archive%29/Documents/SourceCode/global-scroll-service/src/sockets/socket.controller.ts)
- Handles socket events (`connection`, `scroll_batch`).
- **Handshake**: Extracts `deviceId` and `lang`.
- **GeoIP**: Detects country from `socket.handshake.address` using `geoip-lite`.
- **Auth**: Calls `UserService.findOrCreateByDeviceId`.
- **Input Validation**: `zod` schema validation for all incoming payloads.
- **Rate Limiting**: Custom logic to drop excessive events per socket.
- **Localization**: Detect user language from handshake query (`?lang=th`) and send localized system messages.

### Persistence Layer
#### [NEW] [prisma/schema.prisma](file:///Users/nopparat/iCloud%20Drive%20%28Archive%29/Documents/SourceCode/global-scroll-service/prisma/schema.prisma)
- Prisma schema.
- Models:
    - `User`: id, deviceId (unique), countryCode, username, createdAt.
    - `Flag`: id, height (BigInt), userId (relation), countryCode, capturedAt, message.
    - `GlobalHistory`.

## Verification Plan

### Automated Tests
- **Unit Tests**: Test `gameState` logic (Redis mocking).
- **Integration Tests**: Connect a socket client, send scroll events, verify `tick` updates.

### Manual Verification
1.  Start Redis and Postgres locally (via Docker).
2.  Run `npm run dev`.
3.  Use a test script (or simple HTML client) to emit `scroll` events.
4.  Observe console logs for "Height updated" and "Velocity calculated".
5.  Wait 10s to verify "Gravity" kicks in and reduces height.
