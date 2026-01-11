# Development Setup

> Quick guide for setting up a local development environment.

**Just want to use tududi?** Use Docker instead - see the main [README](../README.md).

---

## Prerequisites

- **Node.js** 20+ ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/))
- **SQLite3** (pre-installed on macOS/Linux)

---

## Quick Setup

```bash
# 1. Clone & install
git clone https://github.com/chrisvel/tududi.git
cd tududi
npm install

# 2. Configure environment
cat > backend/.env << EOF
TUDUDI_USER_EMAIL=dev@example.com
TUDUDI_USER_PASSWORD=password123
TUDUDI_SESSION_SECRET=$(openssl rand -hex 64)
EOF

# 3. Initialize database
npm run db:init

# 4. Start servers (2 terminals)
npm run backend:dev    # Terminal 1 - Backend on :3002
npm run frontend:dev   # Terminal 2 - Frontend on :8080
```

Open http://localhost:8080 and login with `dev@example.com` / `password123`

---

## Common Commands

| Command                    | Description                    |
| -------------------------- | ------------------------------ |
| `npm run backend:dev`      | Start backend (port 3002)      |
| `npm run frontend:dev`     | Start frontend (port 8080)     |
| `npm run backend:test`     | Run backend tests              |
| `npm run frontend:test`    | Run frontend tests             |
| `npm run lint`             | Lint all code                  |
| `npm run db:init`          | Create database                |
| `npm run db:reset`         | Reset database (deletes data!) |
| `npm run db:migrate`       | Run pending migrations         |
| `npm run migration:create` | Create new migration           |

---

## Database Migrations

```bash
# Create migration
npm run migration:create -- --name add-new-field

# Run migrations
npm run migration:run

# Rollback last migration
npm run migration:undo

# Check status
npm run migration:status
```

---

## Before Submitting PRs

```bash
# Run all checks
npm run backend:test && npm run frontend:test
npm run lint

# Test migrations (if applicable)
npm run migration:run && npm run migration:undo && npm run migration:run
```

---

## Troubleshooting

| Issue             | Solution                                                    |
| ----------------- | ----------------------------------------------------------- |
| Port in use       | `lsof -ti:8080,3002 \| xargs kill -9` or `npm run kill:all` |
| Database errors   | `npm run db:reset`                                          |
| Module not found  | `rm -rf node_modules && npm install`                        |
| Hot reload broken | Restart both servers, clear browser cache                   |

---

## Project Structure

```
tududi/
|-- frontend/          # React TypeScript app
|   |-- components/   # UI components
|   |-- store/        # Zustand state
|   +-- utils/        # Services & helpers
|-- backend/           # Express API
|   |-- modules/      # Feature modules
|   |-- models/       # Sequelize models
|   +-- migrations/   # DB migrations
+-- docs/              # Documentation
```

See [CODE_ORGANIZATION.md](./CODE_ORGANIZATION.md) for detailed architecture documentation.
