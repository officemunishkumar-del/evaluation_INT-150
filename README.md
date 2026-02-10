# Bid Bliss — Real-Time Auction Platform

A full-stack real-time auction platform where users can create auctions, place bids with live price updates, and settle outcomes automatically — all with concurrency-safe escrow and WebSocket-driven UX.

## Architecture

```
┌─────────────┐         ┌──────────────────────────────────────┐
│   Browser    │◄─WS───►│         Nginx (port 80)              │
│  React SPA   │◄─HTTP──│  /api/*  → Backend :3000             │
└─────────────┘         │  /socket.io/* → Backend :3000 (WS)   │
                        │  /*      → SPA (index.html)          │
                        └──────────────┬───────────────────────┘
                                       │
                        ┌──────────────▼───────────────────────┐
                        │     NestJS Backend (port 3000)       │
                        │                                      │
                        │  AuthModule ─── JWT + bcrypt         │
                        │  AuctionsModule ── CRUD + pagination │
                        │  BidsModule ── pessimistic-lock txns │
                        │  SocketModule ── Socket.IO gateway   │
                        │  JobsModule ── BullMQ workers        │
                        └───────┬──────────────┬───────────────┘
                                │              │
                        ┌───────▼──────┐ ┌─────▼──────┐
                        │  PostgreSQL  │ │   Redis    │
                        │  (data)      │ │  (queues)  │
                        └──────────────┘ └────────────┘
```

### Why These Technologies?

| Choice | Reasoning |
|--------|-----------|
| **NestJS** | Module-per-domain architecture, built-in DI, native TypeORM/BullMQ integration |
| **PostgreSQL** | `SELECT … FOR UPDATE` (pessimistic locking) required for safe concurrent bidding |
| **Redis + BullMQ** | Delayed job scheduling for auction settlement — no polling, automatic retry |
| **Socket.IO** | Room-based broadcast for per-auction live updates; fallback transport for reliability |
| **Pessimistic over Optimistic locking** | Bidding is a high-contention hotpath (many users, same row) — pessimistic locking avoids retry storms |

---

## Concurrency & Escrow Flow

### Bid Placement (pessimistic-lock transaction)

```
1. BEGIN TRANSACTION
2. SELECT auction FOR UPDATE          ← lock row, block other bidders
3. Validate: status=ACTIVE, not expired, amount > currentPrice
4. SELECT bidder FOR UPDATE           ← lock bidder's balance row
5. Validate: bidder ≠ creator, balance ≥ amount
6. Deduct amount from bidder balance
7. Refund previous highest bidder (if different user)
8. Update auction.currentPrice
9. INSERT bid record
10. COMMIT
11. Emit NEW_BID via WebSocket        ← only after commit succeeds
```

> **Key guarantee**: WebSocket events are emitted *after* the transaction commits — clients never see a bid that could be rolled back.

### Auction Settlement (BullMQ delayed job)

```
1. Auction created → schedule delayed job (delay = endsAt - now)
2. Job fires at endsAt:
   a. Lock auction row (FOR UPDATE)
   b. Idempotency check: skip if already SETTLED
   c. Find highest bid → set winner, update status to SETTLED
   d. No bids → set status to ENDED
   e. COMMIT → emit AUCTION_ENDED via WebSocket
3. On failure: automatic retry (3 attempts, exponential backoff)
```

---

## Tech Stack

### Backend
- **Runtime**: Node.js 20 + TypeScript
- **Framework**: NestJS
- **ORM**: TypeORM (PostgreSQL)
- **Queue**: BullMQ (Redis)
- **WebSocket**: Socket.IO via `@nestjs/websockets`
- **Auth**: JWT (Passport) + bcrypt

### Frontend
- **Build**: Vite
- **UI**: React 18 + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State**: React Context + TanStack Query
- **Real-time**: Socket.IO client

---

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis 7+

### Option 1: Docker (recommended)

```bash
docker-compose up --build
```

This starts all 4 services:
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000/api
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### Option 2: Local Development

```bash
# 1. Start infrastructure
docker-compose up postgres redis

# 2. Backend
cd backend
npm install
npm run start:dev          # http://localhost:3000

# 3. Frontend
cd frontend
npm install
npm run dev                # http://localhost:8080
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Backend server port |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_USERNAME` | `postgres` | PostgreSQL user |
| `DB_PASSWORD` | `postgres` | PostgreSQL password |
| `DB_NAME` | `livebid` | PostgreSQL database name |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `JWT_SECRET` | *(hardcoded fallback)* | **Must be set in production** |
| `NODE_ENV` | — | Set to `production` for prod builds |

---

## API Endpoints

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | — | Register (email, password, name?) |
| `POST` | `/api/auth/login` | — | Login → returns JWT |

### Auctions
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/auctions?page=1&limit=20&status=ACTIVE` | — | List auctions (paginated) |
| `GET` | `/api/auctions/:id` | — | Get auction detail with bids |
| `POST` | `/api/auctions` | 🔒 JWT | Create auction |

### Bids
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auctions/:id/bid` | 🔒 JWT | Place bid (amount) |
| `GET` | `/api/auctions/:id/bids` | — | Get bid history |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/users/me` | 🔒 JWT | Get profile + balance + auctions |

---

## WebSocket Events

Connect to the backend with Socket.IO. Pass JWT in handshake: `{ auth: { token } }`.

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join_auction` | `{ auctionId }` | Join auction room for live updates |
| `leave_auction` | `{ auctionId }` | Leave auction room |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `NEW_BID` | `{ auctionId, bid, currentPrice, viewers }` | New bid placed (broadcast to room) |
| `BID_REJECTED` | `{ auctionId, reason }` | Bid failed (sent only to the bidder) |
| `AUCTION_ENDED` | `{ auctionId, winner, finalPrice }` | Auction settled or ended with no bids |
| `USER_JOINED` | `{ auctionId, viewers }` | Viewer count updated |
| `USER_LEFT` | `{ auctionId, viewers }` | Viewer count updated |

---

## Project Structure

```
bid-bliss/
├── backend/
│   ├── src/
│   │   ├── auctions/        # Auction CRUD, entity, DTOs
│   │   ├── bids/            # Bid placement with pessimistic locking
│   │   ├── auth/            # JWT auth, bcrypt, Passport strategy
│   │   ├── users/           # User entity, profile, balance
│   │   ├── socket/          # Socket.IO gateway, room management
│   │   ├── jobs/            # BullMQ settlement worker + scheduler
│   │   ├── common/          # Guards, decorators
│   │   ├── app.module.ts    # Root module (TypeORM, BullMQ config)
│   │   └── main.ts          # Bootstrap, CORS, validation pipe
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # Auth modal, auction cards, layout
│   │   ├── pages/           # Home, Search, Item Detail, Create, Profile, 404
│   │   ├── contexts/        # AuthContext (JWT persistence)
│   │   ├── services/        # API client, socket service
│   │   └── App.tsx          # Routes, protected routes
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml       # Postgres, Redis, Backend, Frontend
└── README.md
```
