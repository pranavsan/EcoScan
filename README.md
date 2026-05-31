# EcoScan

> A lightweight environmental scanning tool that helps users quickly identify and understand the environmental impact of everyday products and materials.

EcoScan exposes a REST API that accepts product or material input and returns structured environmental impact data. Built as a pnpm monorepo with a PostgreSQL-backed Express server, it's designed to be fast to run locally and straightforward to extend.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Package manager | pnpm workspaces |
| Runtime | Node.js 24 |
| Language | TypeScript 5.9 |
| API server | Express (port 5000) |
| Database | PostgreSQL 16 + Drizzle ORM |
| Validation | Zod (`zod/v4`), `drizzle-zod` |
| API codegen | Orval (from OpenAPI spec) |
| Build | esbuild (CJS bundle) |

---

## Prerequisites

- **Node.js 24+**
- **pnpm** — install with `npm install -g pnpm`
- **PostgreSQL 16** running locally or hosted (e.g. Supabase, Railway, Neon)

---

## Environment Variables

Create a `.env` file in the project root:

```env
# Required — Postgres connection string
DATABASE_URL=postgresql://user:password@localhost:5432/ecoscan
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/pranavsan/EcoScan.git
cd EcoScan
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up the database

Push the Drizzle schema to your PostgreSQL database:

```bash
pnpm --filter @workspace/db run push
```

### 4. Start the API server

```bash
pnpm --filter @workspace/api-server run dev
```

The server starts on **http://localhost:5000**.

---

## All Available Commands

| Command | What it does |
|---|---|
| `pnpm --filter @workspace/api-server run dev` | Start the API server on port 5000 |
| `pnpm run typecheck` | Full TypeScript typecheck across all packages |
| `pnpm run build` | Typecheck + build all packages |
| `pnpm --filter @workspace/api-spec run codegen` | Regenerate API hooks and Zod schemas from the OpenAPI spec |
| `pnpm --filter @workspace/db run push` | Push DB schema changes to Postgres (dev only) |

---

## Project Structure

```
EcoScan/
├── artifacts/
│   └── api-server/          # Express API — routes, controllers, AI logic
├── lib/
│   ├── api-spec/
│   │   └── openapi.yaml     # OpenAPI spec — source of truth for all API contracts
│   └── db/
│       └── src/schema/      # Drizzle schema definitions
├── scripts/
│   └── post-merge.sh        # Post-merge hook 
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.json
```
