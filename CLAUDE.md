# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tududi is a self-hosted task management application with hierarchical organization, multi-language support, and Telegram integration. Built as a monorepo with React 18 + TypeScript frontend and Express.js backend using SQLite.

**Version:** See `package.json` for current version.

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

**Code Style:**
- Prettier: 4-space tabs, semicolons, single quotes, trailing commas (es5)
- ESLint: Flat config (`eslint.config.mjs` for frontend, `eslint.config.js` for backend)
- lint-staged: Auto-fixes ESLint + Prettier on staged files

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
npm run pre-release            # Full validation: lint, format, test, E2E
```

## Architecture

### Project Structure

```
tududi/
├── frontend/               # React 18 + TypeScript SPA
│   ├── components/          # React components (~165 files, 23 subdirectories)
│   ├── config/              # Feature flags, API path helpers
│   ├── constants/           # Task status definitions
│   ├── contexts/            # React Context providers (Modal, Sidebar, Telegram)
│   ├── entities/            # TypeScript interfaces (11 model definitions)
│   ├── hooks/               # Custom React hooks
│   ├── store/               # Zustand global state (useStore.ts)
│   ├── styles/              # Tailwind CSS and markdown styles
│   ├── utils/               # API services and utility functions (~30 files)
│   ├── App.tsx              # Root component with React Router
│   ├── Layout.tsx           # Main layout with modal orchestration
│   ├── index.tsx            # Entry point
│   └── i18n.ts              # Internationalization setup
├── backend/                 # Express.js Node.js API
│   ├── modules/             # Feature modules (20 modules)
│   ├── models/              # Sequelize ORM models (20 models + index)
│   ├── migrations/          # Database migrations
│   ├── middleware/           # Auth, authorization, rate limiting, query logging
│   ├── services/            # Core business logic services
│   ├── shared/              # Base repository, AppError, error handler
│   ├── utils/               # Utility functions (timezone, slug, attachments, etc.)
│   ├── config/              # App config, database config, swagger config
│   ├── docs/swagger/        # OpenAPI JSDoc documentation files
│   ├── scripts/             # DB management and utility scripts
│   ├── cmd/                 # Startup scripts (start.sh, start-dev.sh)
│   ├── tests/               # Backend tests (unit/, integration/, helpers/, mocks/)
│   └── app.js               # Express application entry point
├── e2e/                     # Playwright end-to-end tests
│   ├── tests/               # Test specs (inbox, registration, today-view)
│   ├── helpers/             # Test utilities
│   └── bin/                 # Runner scripts
├── public/                  # Static assets, i18n locales (25 languages), banners
├── scripts/                 # Root-level shell scripts (Docker, dev startup)
├── .github/                 # CI/CD workflows, issue templates, PR template
├── webpack.config.js        # Webpack 5 build configuration
├── tsconfig.json            # TypeScript configuration (ES2020)
├── tailwind.config.js       # Tailwind CSS with dark mode support
├── Dockerfile               # Multi-stage production build (Node.js 22-alpine)
└── docker-compose.yml       # Docker Compose configuration
```

### Backend Architecture

#### Modular Design

The backend uses a **module-based architecture** where each feature is self-contained:

```
backend/modules/
├── admin/          # Admin user management (CRUD, roles)
├── areas/          # Task organization areas
├── auth/           # Authentication (login, register, registration service)
├── backup/         # Backup/restore operations
├── feature-flags/  # Feature flag management
├── habits/         # Habit tracking
├── inbox/          # Inbox management (with processing service)
├── notes/          # Note management
├── notifications/  # Push notifications
├── profiles/       # Multi-profile support
├── projects/       # Project management (with due project service)
├── quotes/         # Daily quotes
├── search/         # Universal search
├── shares/         # Project sharing & collaboration
├── tags/           # Tag system (with tags service)
├── tasks/          # Core task management (complex, see below)
├── telegram/       # Telegram bot integration
├── url/            # URL utilities
├── users/          # User management (with API token service)
└── views/          # Custom filtered views
```

**Module Pattern:** Each module exports `{ routes, [service] }` and contains:
- `routes.js` - Express Router
- `controller.js` - Request handlers
- `service.js` - Business logic
- `repository.js` - Data access (optional, extends BaseRepository)
- `validation.js` - Input validation (optional)

Routes are registered at both `/api` and `/api/v1` (for backwards compatibility).

#### Task Module (Core)

The tasks module has a sophisticated nested structure with ~30 files:

```
modules/tasks/
├── index.js                 # Module entry point
├── routes.js                # Express routes
├── repository.js            # Data access layer
├── attachments.js           # File attachment handling
├── events.js                # Task events
├── taskEventService.js      # Event logging for audit trail
├── taskScheduler.js         # Node-cron orchestration
├── taskSummaryService.js    # Scheduled summaries to Telegram
├── recurringTaskService.js  # Recurring task generation
├── deferredTaskService.js   # Deferred task processing
├── dueTaskService.js        # Due task notifications
├── core/                    # Serializers, builders, comparators, parsers
├── middleware/              # Access control
├── operations/              # Completion, grouping, list, parent-child,
│                            # recurring, sorting, subtasks, tags
├── queries/                 # Query builders, metrics queries, metrics computation
└── utils/                   # Constants, logging, validation
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
- Task grouping and sorting operations

#### Database Models (Sequelize + SQLite)

**Core Entities (20 models):**
- `User` - Main user with settings (dark mode, timezone, summaries, pomodoro)
- `Profile` - Multi-profile support (users can have work/personal profiles)
- `Task` - Hierarchical tasks (parent-child, recurring, status tracking)
- `Project` - Task organization
- `Area` - Higher-level task grouping
- `Tag` - Multi-tags via many-to-many relationships
- `Note` - Markdown notes linked to projects

**Supporting Entities:**
- `TaskEvent` - Immutable event log for task changes
- `TaskAttachment` - File attachments for tasks
- `InboxItem` - Inbox management with suggestion metadata
- `Notification` - Push notifications
- `View` - Custom filtered task views
- `ApiToken` - API key management with expiry
- `CalendarToken` - Google Calendar OAuth tokens
- `Backup` - User data backups
- `Habit` - Habit tracking
- `RecurringCompletion` - Recurring task completion tracking
- `Permission` - Permission definitions
- `Role` - User roles
- `Setting` - Application settings
- `Action` - User actions

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

#### Shared Infrastructure

**Base Repository (`shared/database/BaseRepository.js`):**
- Common data access patterns inherited by module repositories
- Provides standard CRUD operations

**Error Handling (`shared/errors/AppError.js`, `shared/middleware/errorHandler.js`):**
- Custom `AppError` class for operational errors
- Centralized error handler middleware
- Sequelize validation/constraint error handling
- Consistent JSON error responses with proper HTTP status codes

**Backend Utilities (`utils/`):**
- `timezone-utils.js` - Timezone-aware date handling
- `slug-utils.js` - URL slug generation
- `attachment-utils.js` - File attachment utilities
- `migration-utils.js` - Database migration helpers
- `profile-utils.js` - Profile-related utilities
- `request-utils.js` - Request processing utilities
- `notificationPreferences.js` - Notification preference handling
- `uid.js` - Unique ID generation

#### Middleware Stack

**Authentication & Authorization:**
- Session-based auth (Express Session + Sequelize store)
- Bearer token support for API access (ApiToken model)
- `requireAuth` middleware loads `req.currentUser` and `req.activeProfile`
- `authorize` middleware for role-based authorization
- Permission cache (`permissionCache.js`) for authorization checks
- Skip paths: `/api/health`, `/api/login`, `/api/current_user`

**Rate Limiting:**
- Auth endpoints: 5 requests/15min
- Unauthenticated API: 100 requests/15min
- Authenticated API: 1000 requests/15min
- Create resource: 50 requests/15min
- API key management: 10 requests/1hr
- Disabled in test environment

**Other Middleware:**
- `queryLogger.js` - SQL query logging for debugging (development)

#### Services & Scheduling

**Core Services (`services/`):**
- `backupService.js` - Full user data backup/restore
- `permissionsService.js` - Permission calculation engine
- `permissionsCalculators.js` - Permission calculation logic
- `rolesService.js` - Role management
- `emailService.js` - SMTP email sending
- `logService.js` - Error logging
- `applyPerms.js` - Permission application utility
- `execAction.js` - Action execution utility

**Scheduled Jobs (managed by `taskScheduler.js`):**
- Summary frequencies: daily, weekdays, weekly, 1h, 2h, 4h, 8h, 12h
- Maintenance: cleanup_tokens (2am daily), deferred_tasks (5min), due_tasks (15min)
- Can be disabled via `DISABLE_SCHEDULER=true`

#### Telegram Integration

Complete bot implementation in `modules/telegram/`:
- `telegramApi.js` - Telegram Bot API client
- `telegramPoller.js` - Long-polling for updates (5sec interval)
- `telegramInitializer.js` - Bot initialization
- `telegramNotificationService.js` - Notification delivery
- State stored in memory during runtime
- Users opt-in via bot token/chat ID in settings
- Task summaries sent via cron scheduler
- Inbox items created from Telegram messages
- Disable with `DISABLE_TELEGRAM=true`

### Frontend Architecture

**Tech Stack:**
- React 18 with TypeScript
- React Router v6 for navigation
- Zustand for global state management
- React Context API for UI state (modals, sidebar, Telegram status)
- Tailwind CSS for styling (with dark mode class support)
- i18next for internationalization (25 languages)
- Webpack 5 for bundling with SWC/Babel loader
- date-fns + date-fns-tz for date handling
- recharts for data visualization
- @dnd-kit for drag-and-drop
- SWR for data fetching patterns

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
- `/profile` - User settings (tabbed: General, Profiles, Telegram, Notifications, Productivity, API Keys, Security, AI, Keyboard Shortcuts)
- `/admin/users` - Admin management (role-based)
- `/backup` - Backup/restore
- `/about` - About page

Public routes:
- `/login`, `/register`

#### State Management

**Zustand Store (`store/useStore.ts`):**
Single global store with slices:
- `NotesStore` - Notes with loading states
- `AreasStore` - Areas with loading states
- `ProjectsStore` - Projects with current selection
- `TagsStore` - Tags with force reload
- `TasksStore` - Tasks with CRUD operations
- `InboxStore` - Inbox with pagination
- `ProfilesStore` - User profiles (multi-profile support)

**React Context Providers (`contexts/`):**
- `ModalContext.tsx` - Modal state management and orchestration
- `SidebarContext.tsx` - Sidebar open/close state
- `TelegramStatusContext.tsx` - Telegram integration status

**Patterns:**
- Zustand for data state (async data fetching with error/loading states)
- React Context for UI state (modals, sidebar)
- `hasLoaded` flags to prevent duplicate loads
- Direct API calls using fetch (no global HTTP client)
- Store mutations are simple property setters

#### Component Structure

**Major Page Components:**
- `TasksToday.tsx` - Today's view (96KB - heaviest component)
- `Notes.tsx` - Notes editor (77KB)
- `ViewDetail.tsx` - Custom view details (67KB)
- `Tasks.tsx` - Main tasks view (53KB)
- `TaskDetails.tsx` - Single task detail page (46KB)
- `Projects.tsx` - Project management (22KB)
- `Layout.tsx` - Main layout wrapper (20KB)

**Component Organization by Feature:**
```
components/
├── Task/              # 42 files: task list, details, forms, status controls
│   ├── TaskDetails/   # 11 subcomponents for task detail cards
│   └── TaskForm/      # 12 subcomponents for task creation/editing
├── Project/           # 14 files: details, kanban board, sharing, insights
├── Profile/           # 14 files: settings page with 11 tabbed panels
│   └── tabs/          # General, Profiles, Telegram, Notifications, etc.
├── Shared/            # 40 files: reusable UI components
│   └── Icons/         # Custom icon components
├── Sidebar/           # 9 files: navigation sidebar sections
├── Inbox/             # 6 files: inbox items, quick capture, suggestions
├── Habits/            # 5 files: habit cards, modals, today widget
├── Calendar/          # 3 files: month, week, day views
├── UniversalSearch/   # 5 files: search with filters and saved views
├── Admin/             # Admin user management
├── Area/              # Area details and modal
├── Tag/               # Tag details, modal, input
├── Note/              # Note details and modal
├── Metrics/           # Project and task metrics cards
├── Notifications/     # Notifications dropdown
├── Productivity/      # Productivity assistant
└── Backup/            # Backup/restore UI
```

**Custom React Hooks (`hooks/`):**
- `useKeyboardShortcuts.ts` - Global keyboard shortcut management
- `useModalManager.ts` - Modal orchestration helper
- `usePersistedModal.ts` - Persistent modal state across navigation

#### API Communication (`utils/`)

- ~30 service/utility files for API operations and helpers
- Direct `fetch` API calls with `credentials: 'include'` for cookies
- `getApiPath()` helper in `config/paths.ts` for relative paths (supports subdirectory deployment)
- `fetcher.ts` - Fetch wrapper utility
- Manual error handling with try/catch
- No global HTTP client or interceptors

**Key Service Files:**
- `tasksService.ts`, `projectsService.ts`, `notesService.ts` - CRUD operations
- `searchService.ts` - Universal search
- `taskIntelligenceService.ts` - AI-related task features
- `taskSortUtils.ts` - Client-side task sorting
- `dateUtils.ts`, `timezoneUtils.ts` - Date/timezone utilities
- `keyboardShortcutsService.ts` - Keyboard shortcut configuration
- `featureFlags.ts` - Feature flag management

#### TypeScript Entities (`entities/`)

11 interface files defining data models:
- `User.ts`, `Profile.ts`, `Task.ts`, `TaskEvent.ts`, `Project.ts`
- `Area.ts`, `Tag.ts`, `Note.ts`, `InboxItem.ts`, `Attachment.ts`, `Metrics.ts`

#### Internationalization

- i18next with HTTP backend loader
- Language detector for browser detection
- Locales loaded from `/locales/{lang}/translation.json`
- Supports **25 languages**: Arabic, Bulgarian, Danish, German, Greek, English, Spanish, Finnish, French, Indonesian, Italian, Japanese, Korean, Dutch, Norwegian, Polish, Portuguese, Romanian, Russian, Slovenian, Swedish, Turkish, Ukrainian, Vietnamese, Chinese

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
- `getApiPath()` and `getLocalesPath()` helpers in `frontend/config/paths.ts`
- Works in root or subdirectory deployments

### Docker & Deployment

**Multi-stage Docker Build:**
- Builder stage: Node.js 22-alpine, builds frontend
- Production stage: Installs only production dependencies
- Runs as non-root user (UID 1001:GID 1001)
- Persistent volumes: `/app/backend/db`, `/app/backend/uploads`
- Health check: `/api/health` every 60s
- Entrypoint script handles runtime UID/GID configuration

**Production Startup (`backend/cmd/start.sh`):**
- Automatic database backup (keeps last 7 days, max 4/day)
- Database initialization and migration
- Auto-creates user if `TUDUDI_USER_EMAIL`/`TUDUDI_USER_PASSWORD` set

### CI/CD Pipeline

**GitHub Actions (`.github/workflows/`):**
- `ci.yml` - Runs on PR/push to main: lint → backend tests → frontend build
- `build.yml` - Runs on push to main: test with coverage → SonarQube scan

## Development Patterns

### Adding a New Module

1. Create module directory in `backend/modules/`
2. Create module files:
   - `index.js` - Export `{ routes, [service] }`
   - `routes.js` - Express Router
   - `controller.js` - Request handlers
   - `service.js` - Business logic
   - `repository.js` - (optional) Extend `BaseRepository` from `shared/database/`
   - `validation.js` - (optional) Input validation
3. Register routes in `backend/app.js` (both `/api` and `/api/v1`)
4. Apply rate limiting to routes in `app.js`
5. Add model if needed in `backend/models/`
6. Create migration if database changes required
7. Add Swagger documentation in `backend/docs/swagger/`

### Database Migrations

1. Create migration: `npm run migration:create -- --name migration-name`
2. Edit migration file in `backend/migrations/`
3. Run migration: `npm run migration:run`
4. Undo if needed: `npm run migration:undo`

**Important:** Always create migrations for schema changes. Never use `db:sync` in production.

### Testing Strategy

**Backend (`backend/tests/`):**
- `unit/` - Unit tests for services, middleware, models, and utilities
- `integration/` - Integration tests for API endpoints
- `helpers/` - Test setup and utilities
- `mocks/` - Mock data
- Use `supertest` for HTTP testing
- Mock external dependencies (Telegram, email)
- Separate test database (`test.sqlite3`)
- 30s timeout, max workers 100%

**Frontend:**
- Component tests with React Testing Library and Jest
- `jest.config.js` at root with ts-jest, jsdom environment
- Mock API responses
- Test user interactions
- Focus on critical user flows

**E2E (`e2e/`):**
- Playwright for end-to-end flows
- Tests: inbox, registration, today-view
- Runner scripts in `e2e/bin/`
- Playwright config at `e2e/playwright.config.ts`

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
const { AppError } = require('../../shared/errors');
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

### Adding Frontend Components

1. Create component in the appropriate `components/` subdirectory
2. Follow existing patterns for the feature domain
3. Use Zustand store for data state, React Context for UI state
4. Use `getApiPath()` from `config/paths.ts` for API calls
5. Add translations to all locale files in `public/locales/`
6. Use Tailwind CSS classes for styling (supports dark mode via `dark:` prefix)
7. Define TypeScript interfaces in `entities/`
8. Create service functions in `utils/` for API communication

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
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`

**Feature Flags:**
- `FF_ENABLE_BACKUPS` - Enable backup feature
- `FF_ENABLE_CALENDAR` - Enable calendar feature

## API Documentation

- **Swagger UI:** `/api-docs` (requires authentication)
- **Swagger JSDoc files:** `backend/docs/swagger/` (areas, auth, inbox, notes, projects, tags, tasks, users)
- **Base URL:** `/api/v1`
- **Authentication:** Session cookies or Bearer token (`Authorization: Bearer <token>`)
- **API Tokens:** Generated via web interface, supports expiry
- **Body parsing limits:** 10MB payload, 50 parameters, 20 array indices (DoS protection)

## SonarQube Integration

This project uses SonarQube for code quality analysis. Configuration in `sonar-project.properties`:
- Project key: `tududi`
- Sources: frontend + backend
- Coverage reports: `coverage-frontend/lcov.info`, `backend/coverage/lcov.info`
- Exclusions: node_modules, dist, coverage, migrations, seeders, test files

When using SonarQube MCP server:
- After generating or modifying code files, call `analyze_file_list` tool to analyze changes
- Disable automatic analysis with `toggle_automatic_analysis` when starting new tasks
- Re-enable automatic analysis when done generating code
- Use `search_my_sonarqube_projects` to find exact project keys
- Don't attempt to verify fixed issues using `search_sonar_issues_in_projects` immediately (server won't reflect updates yet)

## Important Notes

- **Multi-profile isolation:** Always filter queries by `profile_id` from `req.activeProfile`
- **Task hierarchy:** Be careful with parent-child relationships - completion propagates up, status changes may affect children
- **Recurring tasks:** Generated task instances maintain connection to parent pattern via `RecurringCompletion` model
- **Timezone handling:** Use timezone-aware date utilities (`utils/timezone-utils.js` backend, `utils/timezoneUtils.ts` frontend)
- **Rate limiting:** Be aware of limits when developing API-heavy features
- **SQLite concurrency:** WAL mode enabled, but be mindful of write-heavy operations
- **Telegram polling:** State is in-memory; restart clears polling list (users re-added on next check)
- **Session storage:** Uses Sequelize store, not in-memory; survives restarts
- **Query string security:** Express is configured with explicit limits (50 parameters, 20 array indices) to prevent DoS attacks via memory exhaustion
- **URL validation:** FRONTEND_URL is validated to ensure only http/https protocols and logs security warnings for external domains in production
- **Feature flags:** Controlled via environment variables and `feature-flags` module; check `config/featureFlags.ts` on frontend and `modules/feature-flags/` on backend
- **Keyboard shortcuts:** Managed via `useKeyboardShortcuts` hook and `keyboardShortcutsService.ts`
- **Universal search:** Full-text search across tasks, projects, notes via `search` module and `UniversalSearch` component
- **Docker volumes:** Database (`/app/backend/db`) and uploads (`/app/backend/uploads`) must be persisted
