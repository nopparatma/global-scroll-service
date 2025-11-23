# Global Scroll - Backend Specification

## 1. Project Overview
**Global Scroll** is a collaborative real-time application where users collectively scroll to increase a global height counter. The goal is to reach "space" and beyond, unlocking visual themes and milestones along the way.

**Core Philosophy:** "Creative Simplicity" & "Real-time Unity".

## 2. Technology Stack
*   **Runtime:** Node.js (TypeScript)
*   **Real-time Engine:** Socket.io (perfect for event-based bi-directional communication).
*   **In-Memory Store:** Redis
    *   Stores `Current Global Height` (Atomic counters).
    *   Stores `Current Velocity`.
    *   Stores `Active User Count`.
    *   Handles "Gravity" expiration/timers.
*   **Persistent Database:** PostgreSQL
    *   Stores `Flags` (Milestones).
    *   Stores `User Profiles` (optional, for stats).
    *   Stores `Global History` (for analytics).

## 3. System Architecture

### 3.1 The "Game Loop" (Server-Side)
Since we need to handle potentially thousands of incoming scroll events and calculate velocity/gravity, we cannot simply write to the DB on every request.

1.  **Buffer/Accumulate:** Clients send scroll deltas (e.g., `+50px`). The server accumulates these in Redis (Atomic `INCRBY`).
2.  **Tick Loop (e.g., every 100ms - 500ms):**
    *   Read the accumulated delta.
    *   Update `Global Height`.
    *   Calculate `Global Velocity` (Delta / Time).
    *   Broadcast new `Height` and `Velocity` to all connected clients.
    *   Check for **Milestones** (Flags).
3.  **Gravity Worker:**
    *   Runs independently.
    *   Checks `Last Activity Timestamp`.
    *   If idle > 10s, starts decrementing `Global Height` at a decay rate.

## 4. Data Models

### 4.1 Redis Keys
*   `global:height` (String/BigInt): Current total height.
*   `global:height:{country_code}` (String/BigInt): Height per country (e.g., `global:height:TH`).
*   `global:velocity` (Integer): Current speed.
*   `global:last_activity` (Timestamp): Time of last user interaction.
*   `milestone:next` (String/BigInt): The next target height.

### 4.2 Database Schema (Persistent)

**Table: Users**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id VARCHAR(255) UNIQUE NOT NULL,
  country_code VARCHAR(2) DEFAULT 'XX', -- ISO 3166-1 alpha-2
  username VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Table: Flags**
```sql
CREATE TABLE flags (
  id SERIAL PRIMARY KEY,
  height BIGINT NOT NULL, -- Changed to BIGINT
  user_id UUID REFERENCES users(id),
  country_code VARCHAR(2), -- Capture country at time of planting
  captured_at TIMESTAMP DEFAULT NOW(),
  message TEXT
);
```

## 5. API & WebSocket Events

### 5.1 WebSocket (Socket.io)

**Namespace:** `/game`

**Handshake:** `?deviceId=xyz123&lang=th` (Server also detects IP for Country)

**Client -> Server Events:**
*   `join`: User connects.
*   `scroll_batch`: `{ delta: number }`
*   `plant_flag`: `{ message: string }`

**Server -> Client Events:**
*   `init`: `{ height: string, velocity, countryHeights: Record<string, string>, user: { id, country } }`
    *   *Note:* `height` sent as String to avoid JS Integer overflow (Safe limit 2^53).
*   `tick`: `{ height: string, velocity, countryHeights: Record<string, string> }`
*   `milestone_unlocked`: `{ height: string, capturedBy: { username, country } }`
*   `gravity_warning`: `{ status: "active" }` - Warns users that height is falling!

### 5.2 REST API (Optional/Support)
*   `GET /api/leaderboard`: Top contributors.
*   `GET /api/flags`: List of all historical flags planted.

## 6. Game Mechanics & Logic Detail

### 6.1 Scroll Validation
To prevent bots from instantly finishing the game:
*   Rate limit `scroll` events per socket.
*   Max `delta` per message (e.g., a human can't scroll 10,000px in 10ms).
*   *Anti-Cheat:* Heuristics on server to detect constant, machine-perfect intervals.

### 6.2 The "Gravity"
*   On every `scroll` event, update `global:last_activity` = `Date.now()`.
*   **Gravity Loop:**
    *   Check `Date.now() - global:last_activity`.
    *   If > 10,000ms (10s):
        *   Decrease `global:height` by `GRAVITY_RATE` (e.g., 100px/sec).
        *   Broadcast `tick` with decreasing height.
        *   Stop at 0.

### 6.3 Planting Flags
*   Server tracks `next_milestone` (e.g., 1000, 2000, 3000).
*   When `global:height` crosses `next_milestone`:
    *   Identify the user who pushed it over (or the top contributor in the last window).
    *   Create `Flag` record in DB.
    *   Broadcast `milestone_unlocked`.
    *   Increment `next_milestone`.

## 7. Architecture Strategy (High Concurrency & Cost Optimization)

### 7.1 Batching Strategy (The "Secret Sauce")
To handle 100k+ concurrent users without melting the server:

*   **Client-Side Batching:**
    *   Clients **MUST NOT** emit a socket event on every pixel scroll.
    *   Clients accumulate scroll distance locally.
    *   Send a `scroll_batch` event every **3-5 seconds** (or when buffer > X pixels).
*   **Server-Side Batching:**
    *   **Hot Data (Redis):** Incoming batches are immediately applied to Redis (Atomic INCR). This is fast enough for real-time.
    *   **Cold Data (DB):** We do **NOT** write to PostgreSQL on every scroll.
    *   A background worker syncs the final `Global Height` from Redis to PostgreSQL (for backup/history) only once every **10-30 seconds**.

### 7.2 Anti-Cheat System
*   **Velocity Check:**
    *   Server calculates: `User Velocity = Batch Delta / Time Since Last Batch`.
    *   If `User Velocity` > `MAX_HUMAN_SPEED` (e.g., 5000px/sec), the batch is **rejected**.
*   **Rate Limiting:**
    *   Socket.io middleware to limit event frequency (e.g., max 1 `scroll_batch` per second).
*   **Ban Logic:**
    *   If a user triggers > 3 violations, temporarily ignore their input.

## 8. Scalability Strategy
*   **Socket.io Adapters:** Use Redis Adapter to scale to multiple server instances if users > 10k.
*   **Throttling:** Only broadcast `tick` if values changed significantly or at fixed max rate (e.g., 10Hz).
