# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tududi is a self-hosted task management application with hierarchical organization, multi-language support, and Telegram integration. Built as a monorepo with React 18 + TypeScript frontend and Express.js backend using SQLite.

## Common Commands

### Development

```bash
# Start both frontend and backend with hot reload
npm start

# Individual services
npm run frontend:dev    # Frontend only (http://localhost:8080)
npm run backend:dev     # Backend only (http://localhost:3002)
```

### Building

```bash
# Build frontend (output to dist/)
npm run build

# Type-check without building
npm run frontend:start
```

### Testing

```bash
# Run all tests
npm test                       # Backend tests only
npm run test:coverage          # Backend + frontend with coverage

# Backend testing
npm run backend:test           # All backend tests
npm run backend:test:unit      # Unit tests only
npm run backend:test:integration  # Integration tests only
npm run backend:test:watch     # Watch mode

# Frontend testing
npm run frontend:test          # Run once
npm run frontend:test:watch    # Watch mode
npm run frontend:test:coverage # With coverage

# E2E testing (Playwright)
npm run test:ui                # Headless (CI mode)
npm run test:ui:mode           # UI mode browser
npm run test:ui:headed         # Headed with slowmo
```

### Linting & Formatting

```bash
# Check for issues
npm run lint                   # ESLint (frontend + backend)
npm run format                 # Prettier check

# Auto-fix
npm run lint:fix               # Fix ESLint issues
npm run format:fix             # Fix formatting

# Pre-push validation (runs linting on staged files)
npm run pre-push
```

### Database Management

```bash
# Initialization
npm run db:init                # Initialize database
npm run db:sync                # Sync models without migrations
npm run db:migrate             # Run pending migrations
npm run db:status              # Check migration status

# Development utilities
npm run db:seed                # Seed development data
npm run db:reset               # Reset database
npm run db:reset-and-seed      # Reset and seed in one command

# Migrations
npm run migration:create       # Create new migration
npm run migration:run          # Run pending migrations
npm run migration:undo         # Undo last migration
npm run migration:status       # Check migration status

# User management
npm run user:create            # Create new user
```

### Other

```bash
npm run kill:all               # Kill processes on ports 8080 and 3002
npm run docker:test-build      # Test Docker build
```

## Architecture

### Project Structure

```
tududi/
├── frontend/           # React 18 + TypeScript SPA
│   ├── components/     # React components
│   ├── pages/          # Route pages
│   ├── store/          # Zustand global state
│   ├── services/       # API service modules
│   ├── entities/       # TypeScript interfaces
│   └── i18n.ts         # Internationalization setup
├── backend/            # Express.js Node.js API
│   ├── modules/        # Feature modules (modular architecture)
│   ├── models/         # Sequelize ORM models (21 models)
│   ├── migrations/     # Database migrations
│   ├── middleware/     # Auth, error handling, rate limiting
│   ├── services/       # Business logic services
│   ├── scripts/        # DB and utility scripts
│   └── app.js          # Express application entry
├── e2e/                # Playwright end-to-end tests
├── public/             # Static assets & i18n locales
└── webpack.config.js   # Webpack build configuration
```

### Backend Architecture

#### Modular Design

The backend uses a **module-based architecture** where each feature is self-contained:

```
backend/modules/
├── tasks/              # Core task management (complex module)
├── projects/           # Project management
├── areas/              # Task organization areas
├── notes/              # Note management
├── tags/               # Tags system
├── auth/               # Authentication (login, register)
├── profiles/           # Multi-profile support
├── shares/             # Project sharing & collaboration
├── telegram/           # Telegram bot integration
├── notifications/      # Push notifications
├── backup/             # Backup/restore operations
├── habits/             # Habit tracking
├── inbox/              # Inbox items
├── views/              # Custom filtered views
└── [others]            # Feature flags, search, admin, etc.
```

**Module Pattern:** Each module exports `{ routes, [service] }` and contains:
- `routes.js` - Express Router
- `controller.js` - Request handlers
- `service.js` - Business logic
- `repository.js` - Data access (optional)
- `validation.js` - Input validation (optional)

Routes are registered at both `/api` and `/api/v1` (for backwards compatibility).

#### Task Module (Core)

The tasks module has a sophisticated nested structure:

```
modules/tasks/
├── core/              # Serializers, builders, comparators
├── operations/        # Subtasks, tags, completion, parent-child, recurring
├── queries/           # Query builders, metrics computation
├── middleware/        # Access control
└── utils/             # Validation, logging, constants, timezone
```

**Key Task Features:**
- Hierarchical subtasks with parent-child relationships
- Recurring tasks with intelligent pattern calculation
- Task status transitions with parent-child propagation
- Priority editing (supports kanban board)
- Immutable task events for audit trail
- File attachments
- Tag management with many-to-many relationships
- Timezone-aware date handling

#### Database Models (Sequelize + SQLite)

**Core Entities:**
- `User` - Main user with settings (dark mode, timezone, summaries, pomodoro)
- `Profile` - Multi-profile support (users can have work/personal profiles)
- `Task` - Hierarchical tasks (parent-child, recurring, status tracking)
- `Project` - Task organization
- `Area` - Higher-level task grouping
- `Tag` - Multi-tags via many-to-many relationships
- `Note` - Markdown notes linked to projects

**Supporting Entities:**
- `TaskEvent` - Immutable event log for task changes
- `InboxItem` - Inbox management with suggestion metadata
- `Notification` - Push notifications
- `View` - Custom filtered task views
- `ApiToken` - API key management with expiry
- `Backup` - User data backups
- `Habit` - Habit tracking
- Plus others for shares, quotes, feature flags, etc.

**Key Associations:**
- **Profile-based isolation:** User → multiple Profiles → all entities scoped to profiles
- **Hierarchical tasks:** Task → ParentTask (self-reference), Subtasks
- **Many-to-many:** Tasks ↔ Tags, Notes ↔ Tags, Projects ↔ Tags
- **Audit trail:** Task → TaskEvents (immutable log)

**SQLite Performance Tuning:**
- WAL mode (Write-Ahead Logging) for better concurrent access
- 64MB cache size, memory-mapped I/O (256MB)
- Busy timeout (5s) to prevent "database locked" errors
- Optimized for slow I/O systems (e.g., Synology NAS)

#### Middleware Stack

**Authentication & Authorization:**
- Session-based auth (Express Session + Sequelize store)
- Bearer token support for API access (ApiToken model)
- `requireAuth` middleware loads `req.currentUser` and `req.activeProfile`
- Permission cache for authorization checks
- Skip paths: `/api/health`, `/api/login`, `/api/current_user`

**Rate Limiting:**
- Auth endpoints: 5 requests/15min
- Unauthenticated API: 100 requests/15min
- Authenticated API: 1000 requests/15min
- Create resource: 50 requests/15min
- API key management: 10 requests/1hr
- Disabled in test environment

**Error Handling:**
- Custom `AppError` class for operational errors
- Centralized error handler (`shared/middleware/errorHandler.js`)
- Sequelize validation/constraint error handling
- Consistent JSON error responses with proper HTTP status codes

#### Services & Scheduling

**Core Services:**
- `backupService.js` - Full user data backup/restore
- `permissionsService.js` - Permission calculation engine
- `emailService.js` - SMTP email sending
- `logService.js` - Error logging

**Task-Specific Services** (in `modules/tasks/`):
- `taskScheduler.js` - Node-cron orchestration
- `taskSummaryService.js` - Scheduled summaries to Telegram
- `taskEventService.js` - Event logging for audit trail
- `recurringTaskService.js` - Recurring task generation
- `deferredTaskService.js` - Deferred task processing
- `dueTaskService.js` - Due task notifications

**Scheduled Jobs:**
- Summary frequencies: daily, weekdays, weekly, 1h, 2h, 4h, 8h, 12h
- Maintenance: cleanup_tokens (2am daily), deferred_tasks (5min), due_tasks (15min)
- Can be disabled via `DISABLE_SCHEDULER=true`

#### Telegram Integration

Complete bot implementation in `modules/telegram/`:
- Long-polling for updates (5sec interval, not webhooks)
- State stored in memory during runtime
- Users opt-in via bot token/chat ID in settings
- Task summaries sent via cron scheduler
- Inbox items created from Telegram messages
- Full bot command support via modal parsing
- Disable with `DISABLE_TELEGRAM=true`

### Frontend Architecture

**Tech Stack:**
- React 18 with TypeScript
- React Router v6 for navigation
- Zustand for global state management
- Tailwind CSS for styling
- i18next for internationalization (24 languages)
- Webpack 5 for bundling

#### Routing & Pages

Protected routes (authenticated users only):
- `/today` - Today's tasks view (default route)
- `/upcoming` - Upcoming tasks (lazy-loaded)
- `/tasks` - All tasks view
- `/inbox` - Inbox management
- `/habits` - Habit tracking
- `/projects`, `/areas`, `/tags` - Organization views
- `/views` - Custom filtered views
- `/notes` - Note management
- `/calendar` - Calendar view
- `/profile` - User settings
- `/admin/users` - Admin management (role-based)
- `/backup` - Backup/restore

Public routes:
- `/login`, `/register`

#### State Management (Zustand)

Single global store (`frontend/store/useStore.ts`) with slices:
- `NotesStore` - Notes with loading states
- `AreasStore` - Areas with loading states
- `ProjectsStore` - Projects with current selection
- `TagsStore` - Tags with force reload
- `TasksStore` - Tasks with CRUD operations
- `InboxStore` - Inbox with pagination
- `ProfilesStore` - User profiles (multi-profile support)

**Patterns:**
- Async data fetching with error/loading states
- `hasLoaded` flags to prevent duplicate loads
- Direct API calls using fetch (no global HTTP client)
- Store mutations are simple property setters

#### Component Structure

**Major Page Components:**
- `TasksToday.tsx` - Today's view (96KB - heavy component)
- `TaskDetails.tsx` - Single task detail page (46KB)
- `Tasks.tsx` - Main tasks view with grouping/filters
- `Projects.tsx` - Project management (22KB)
- `Notes.tsx` - Notes editor (77KB)
- `Calendar.tsx` - Calendar with recurring events
- `Habits.tsx` - Habit tracking

**Task Component Hierarchy** (`components/Task/`):
- `GroupedTaskList.tsx` - List with grouping (kanban-like)
- `TaskDetails.tsx` - Full task details view
- `TaskItem.tsx` - Single task in list
- `TaskHeader.tsx` - Task title/header with inline editing
- `TaskStatusControl.tsx` - Status/priority controls
- `TaskForm/` - Creation/editing forms
- `NewTask.tsx` - Quick add task

**Shared Components:**
- `Navbar.tsx` - Top navigation
- `Sidebar.tsx` - Side navigation with drag-drop
- `Layout.tsx` - Main layout wrapper with modal orchestration

#### API Communication

- Direct `fetch` API calls with `credentials: 'include'` for cookies
- `getApiPath()` helper for relative paths (supports subdirectory deployment)
- Manual error handling with try/catch
- No global HTTP client or interceptors

#### Internationalization

- i18next with HTTP backend loader
- Language detector for browser detection
- Locales loaded from `/locales/{lang}/translation.json`
- Supports 24 languages including English, Spanish, Portuguese, German, Japanese, Chinese, etc.

### Multi-Profile Support

**Feature Architecture:**
- Each user can have multiple profiles (e.g., work, personal)
- Active profile selected per user
- All tasks/notes/projects scoped to profile
- Profile switching via settings
- DB relationships: User (1:N) Profile (1:N) Entities

**Implementation:**
- `req.activeProfile` loaded by auth middleware
- All queries filtered by profile_id
- Profile isolation prevents cross-profile contamination

### Home Assistant Ingress Support

The application detects and handles subdirectory deployment:
- Detects `/api/hassio_ingress/[token]` paths
- Configurable `TUDUDI_BASE_PATH` environment variable
- `getApiPath()` and `getLocalesPath()` helpers normalize paths
- Works in root or subdirectory deployments

## Development Patterns

### Adding a New Module

1. Create module directory in `backend/modules/`
2. Create module files:
   - `index.js` - Export `{ routes, [service] }`
   - `routes.js` - Express Router
   - `controller.js` - Request handlers
   - `service.js` - Business logic
3. Register routes in `backend/app.js` (both `/api` and `/api/v1`)
4. Add model if needed in `backend/models/`
5. Create migration if database changes required

### Database Migrations

1. Create migration: `npm run migration:create -- --name migration-name`
2. Edit migration file in `backend/migrations/`
3. Run migration: `npm run migration:run`
4. Undo if needed: `npm run migration:undo`

**Important:** Always create migrations for schema changes. Never use `db:sync` in production.

### Testing Strategy

**Backend:**
- Unit tests for services and utilities
- Integration tests for API endpoints
- Use `supertest` for HTTP testing
- Mock external dependencies (Telegram, email)
- Separate test database (`test.sqlite3`)

**Frontend:**
- Component tests with React Testing Library
- Mock API responses
- Test user interactions
- Focus on critical user flows

**E2E:**
- Playwright for end-to-end flows
- Test critical user journeys
- Run in CI/CD pipeline

### Error Handling Pattern

```javascript
// Controller
try {
  const result = await service.doSomething();
  res.json(result);
} catch (error) {
  next(error); // Let error handler middleware handle it
}

// Service - throw AppError for operational errors
const { AppError } = require('../shared/middleware/errorHandler');
if (!found) {
  throw new AppError('Resource not found', 404, 'NOT_FOUND');
}
```

### Query Patterns

**Always include profile filtering:**
```javascript
const tasks = await Task.findAll({
  where: {
    profile_id: req.activeProfile.id,
    status: 'active'
  },
  include: [/* associations */]
});
```

**Use constants for consistent includes:**
```javascript
const { TASK_INCLUDES } = require('./constants');
const tasks = await Task.findAll({
  where: { profile_id },
  include: TASK_INCLUDES // Consistent eager loading
});
```

## Configuration

### Environment Variables

**Required:**
- `TUDUDI_SESSION_SECRET` - Session encryption key (use `openssl rand -hex 64`)
- `TUDUDI_USER_EMAIL` - Initial admin email
- `TUDUDI_USER_PASSWORD` - Initial admin password

**Optional:**
- `NODE_ENV` - development, production, test (default: development)
- `PORT` - Backend port (default: 3002)
- `FRONTEND_URL` - Frontend origin for CORS and email verification redirects
  - **Security Note**: Must be controlled by system administrators only. This URL is used in email verification redirects. The application validates the URL format and protocol (http/https only). Never set this to a user-controlled value or untrusted domain.
- `BACKEND_URL` - Backend origin
- `TUDUDI_ALLOWED_ORIGINS` - Comma-separated CORS origins
- `DB_FILE` - Database path (default: `backend/db/{env}.sqlite3`)
- `DISABLE_SCHEDULER` - Disable cron jobs (default: false)
- `DISABLE_TELEGRAM` - Disable Telegram bot (default: false)
- `SWAGGER_ENABLED` - Enable API docs (default: true)
- `RATE_LIMITING_ENABLED` - Enable rate limiting (default: true)
- `TUDUDI_BASE_PATH` - For subdirectory deployment (e.g., `/tududi`)

**Email (SMTP):**
- `EMAIL_SMTP_HOST`, `EMAIL_SMTP_PORT`, `EMAIL_SMTP_USER`, `EMAIL_SMTP_PASSWORD`
- `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_NAME`

**Google OAuth (Calendar):**
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

## API Documentation

- **Swagger UI:** `/api-docs` (requires authentication)
- **Base URL:** `/api/v1`
- **Authentication:** Session cookies or Bearer token (`Authorization: Bearer <token>`)
- **API Tokens:** Generated via web interface, supports expiry

## SonarQube Integration

This project uses SonarQube MCP server for code quality analysis. Important guidelines:

- After generating or modifying code files, call `analyze_file_list` tool to analyze changes
- Disable automatic analysis with `toggle_automatic_analysis` when starting new tasks
- Re-enable automatic analysis when done generating code
- Use `search_my_sonarqube_projects` to find exact project keys
- Don't attempt to verify fixed issues using `search_sonar_issues_in_projects` immediately (server won't reflect updates yet)

## Important Notes

- **Multi-profile isolation:** Always filter queries by `profile_id` from `req.activeProfile`
- **Task hierarchy:** Be careful with parent-child relationships - completion propagates up, status changes may affect children
- **Recurring tasks:** Generated task instances maintain connection to parent pattern
- **Timezone handling:** Use timezone-aware date utilities for due dates
- **Rate limiting:** Be aware of limits when developing API-heavy features
- **SQLite concurrency:** WAL mode enabled, but be mindful of write-heavy operations
- **Telegram polling:** State is in-memory; restart clears polling list (users re-added on next check)
- **Session storage:** Uses Sequelize store, not in-memory; survives restarts
- **Query string security:** Express is configured with explicit limits (50 parameters, 20 array indices) to prevent DoS attacks via memory exhaustion
- **URL validation:** FRONTEND_URL is validated to ensure only http/https protocols and logs security warnings for external domains in production
