# Global Scroll Service

Backend service for the Global Scroll application.

## Prerequisites

*   Docker & Docker Compose
*   Node.js 18+ (for local dev without Docker)

## Setup & Run

1.  **Clone the repository**
2.  **Create Environment File**
    ```bash
    cp .env.example .env
    ```
3.  **Start with Docker Compose** (Recommended)
    ```bash
    docker-compose up --build
    ```
    This will start:
    *   Node.js App (Port 3000)
    *   Redis (Port 6379)
    *   PostgreSQL (Port 5432)

4.  **Local Development** (Without Docker for App)
    *   Start Redis & Postgres via Docker:
        ```bash
        docker-compose up redis postgres -d
        ```
    *   Install dependencies:
        ```bash
        npm install
        ```
    *   Run Prisma Generate:
        ```bash
        npx prisma generate
        ```
    *   Start Dev Server:
        ```bash
        npm run dev
        ```

## API / Socket Events

*   **Socket Endpoint:** `ws://localhost:3000`
*   **Namespace:** `/` (Default)
*   **Handshake Query:** `?deviceId=YOUR_DEVICE_ID&lang=en`

### Events
*   `scroll_batch`: Send `{ delta: number }`
*   `tick`: Receive `{ height, velocity, countryHeights }`

## Architecture
*   **Node.js + Express + Socket.io**: Core server.
*   **Redis**: High-speed counter & state management.
*   **PostgreSQL**: Persistent storage for Users & Flags.
*   **Prisma**: ORM.
*   **Workers**:
    *   `gravity.worker`: Applies gravity decay.
    *   `persistence.worker`: Syncs Redis state to DB.