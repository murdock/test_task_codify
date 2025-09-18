# 🎰 Slots App

A minimalistic full-stack slot machine built with **React + Vite (TS)** on the client and **Express + Redis (TS)** on the server, managed in a **pnpm** workspace.

---

## Table of Contents
- [Monorepo Layout](#monorepo-layout)
- [Quick Start](#quick-start)
- [Game Rules](#game-rules)
- [Implementation Notes](#implementation-notes)
  - [Server (Express + Redis)](#server-express--redis)
  - [Client (React + Vite)](#client-react--vite)
  - [Cheating Logic](#cheating-logic)
- [Testing](#testing)
  - [Server Tests](#server-tests)
  - [Client Tests](#client-tests)
- [Scripts](#scripts)
- [Troubleshooting](#troubleshooting)
- [My Thought Process](#my-thought-process)
- [Suggested Commit History](#suggested-commit-history)

---

## Monorepo Layout

```
.
├── client
│   ├── __mocks__
│   │   ├── styleMock.js
│   │   └── uuid.ts
│   ├── eslint.config.js
│   ├── index.html
│   ├── jest.config.ts
│   ├── package.json
│   ├── public
│   │   └── slots.svg
│   ├── src
│   │   ├── App.css
│   │   ├── App.test.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── setupTests.ts
│   │   └── vite-env.d.ts
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── tsconfig.test.json
│   └── vite.config.ts
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── README.MD
└── server
    ├── __tests__
    │   ├── game.e2e.test.js
    │   ├── game.e2e.test.js.map
    │   └── game.e2e.test.ts
    ├── jest.config.ts
    ├── package.json
    ├── src
    │   └── index.ts
    └── tsconfig.json
```

---

## Quick Start

### Prereqs
- Node 18+ (Node 20/22/24 OK)
- Redis running locally (e.g. `redis-server`)
- `pnpm` installed (`npm i -g pnpm`)

### Install
```sh
pnpm install
```

### Run dev servers
```sh
# Terminal A
cd server && pnpm dev   # ts-node on http://localhost:4000

# Terminal B
cd client && pnpm dev   # Vite dev server (usually http://localhost:5173)
```

### Build & run prod
```sh
# build both packages (from repo root)
pnpm -r build

# run compiled server
cd server && pnpm start
```

---

## Game Rules

- New session starts with **10 credits**.
- Pulling lever (rolling) **costs 1 credit**.
- 3 blocks (1 row). Win if all three symbols match.
- Symbols & rewards:
  - **C** (Cherry) → +10 credits
  - **L** (Lemon) → +20 credits
  - **O** (Orange) → +30 credits
  - **W** (Watermelon) → +40 credits
- **Cash Out** moves remaining session credits to the user account and closes the session.

---

## Implementation Notes

### Server (Express + Redis)
- Endpoints: `/api/session`, `/api/roll`, `/api/cashout`
- Redis stores sessions & accounts
- Includes **cheating logic** depending on credits
- Test hooks available when `NODE_ENV=test`

### Client (React + Vite)
- Auto-starts session on load
- Reels spin with staged delay (1s, 2s, 3s)
- Overlay for server errors
- Emojis for symbols (🍒 🍋 🍊 🍉)

### Cheating Logic
- `< 40` credits: fair
- `40–60` credits: 30% reroll on win
- `> 60` credits: 60% reroll on win

---

## Testing

### Server Tests
- Jest + supertest
- Covers sessions, rolls, cheating, cashouts

### Client Tests
- Jest + @testing-library/react
- Fake timers for reel animation
- Mocked fetch for API endpoints

---

## Scripts

### Server
```json
{
  "scripts": {
    "dev": "ts-node src/index.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/index.js",
    "test": "NODE_ENV=test jest"
  }
}
```

### Client
```json
{
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "jest"
  }
}
```
