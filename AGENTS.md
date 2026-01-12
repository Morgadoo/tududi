# AGENTS.md - AI Coding Agent Guidelines for Tududi

> Comprehensive guide for AI coding agents working with the tududi codebase.

## Quick Reference

| Component | Technology             | Port | Entry Point                  |
| --------- | ---------------------- | ---- | ---------------------------- |
| Frontend  | React 18 + TypeScript  | 8080 | `frontend/index.tsx`         |
| Backend   | Express.js + Node.js   | 3002 | `backend/app.js`             |
| Database  | SQLite + Sequelize ORM | -    | `backend/models/index.js`    |
| State     | Zustand                | -    | `frontend/store/useStore.ts` |

**Quick Start:**

```bash
npm install              # Install dependencies
npm run db:init          # Initialize database
npm run backend:dev      # Start backend (terminal 1)
npm run frontend:dev     # Start frontend (terminal 2)
```

**Quick Test:**

```bash
npm run backend:test     # Run backend tests
npm run frontend:test    # Run frontend tests
npm run lint             # Check code style
npm run build            # Build frontend for production
```

---

## Project Overview

**Tududi** is a self-hosted, full-stack task management application implementing the PARA method (Projects, Areas, Resources, Archives) with GTD (Getting Things Done) principles.

**Core Entities:**

- **Tasks** - Individual actionable items with subtasks, recurring patterns, and habits
- **Projects** - Collections of tasks working toward a goal
- **Areas** - Categories grouping related projects (e.g., "Work", "Personal")
- **Notes** - Markdown-formatted text attached to projects
- **Tags** - Cross-cutting labels for tasks, notes, and projects
- **Inbox** - Quick capture items for later processing

**Key Features:**

- Recurring tasks with multiple patterns (daily, weekly, monthly)
- Project sharing and collaboration with permission levels
- Telegram bot integration for mobile capture
- 24-language internationalization (i18n)
- REST API with Swagger documentation

---

## Architecture Overview

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│   │  Web Browser │    │ Telegram App │    │  API Client  │     │
│   └──────┬───────┘    └──────┬───────┘    └──────┬───────┘     │
└──────────┼───────────────────┼───────────────────┼──────────────┘
           │                   │                   │
┌──────────┼───────────────────┼───────────────────┼──────────────┐
│          ▼                   │                   ▼              │
│   ┌──────────────┐           │         ┌──────────────┐        │
│   │  React App   │           │         │ Bearer Token │        │
│   │  (Port 8080) │           │         │     Auth     │        │
│   │              │           │         └──────┬───────┘        │
│   │  - Zustand   │           │                │                │
│   │  - Router    │           │                │                │
│   │  - i18next   │           │                │                │
│   └──────┬───────┘           │                │                │
│          │                   │                │                │
│   SESSION COOKIE             │                │                │
└──────────┼───────────────────┼────────────────┼─────────────────┘
           │                   │                │
           ▼                   ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXPRESS SERVER (Port 3002)                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    MIDDLEWARE STACK                         │ │
│  │  Helmet → CORS → Session → Rate Limit → Auth → Routes      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│  ┌───────────────────────────┼───────────────────────────────┐  │
│  │                    API ROUTES (/api/v1)                    │  │
│  │  tasks │ projects │ areas │ notes │ tags │ inbox │ habits │  │
│  └───────────────────────────┼───────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────┼───────────────────────────────┐  │
│  │                    SERVICE LAYER                           │  │
│  │            Business logic, validation, permissions         │  │
│  └───────────────────────────┼───────────────────────────────┘  │
│                              │                                   │
│  ┌───────────────────────────┼───────────────────────────────┐  │
│  │                   REPOSITORY LAYER                         │  │
│  │              Sequelize queries, data access                │  │
│  └───────────────────────────┼───────────────────────────────┘  │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│   │    SQLite    │    │   Uploads    │    │   Sessions   │     │
│   │   Database   │    │  (files)     │    │    Store     │     │
│   └──────────────┘    └──────────────┘    └──────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

### 3-Layer Architecture Pattern

Every backend module follows this pattern:

```
HTTP Request
     │
     ▼
┌─────────────┐
│   Routes    │  ← Route definitions, request handling
│ (routes.js) │     Validates input, calls service
└─────┬───────┘
      │
      ▼
┌─────────────┐
│   Service   │  ← Business logic, authorization
│(service.js) │     Calls repository, handles errors
└─────┬───────┘
      │
      ▼
┌─────────────┐
│ Repository  │  ← Database queries via Sequelize
│(repository.js)   Returns raw model instances
└─────┬───────┘
      │
      ▼
┌─────────────┐
│   Models    │  ← Sequelize model definitions
│ (models/)   │     Associations, validations
└─────────────┘
```

---

## Directory Structure

```
tududi/
├── frontend/                    # React TypeScript SPA
│   ├── components/             # React components by feature
│   │   ├── Task/              # Task-related (TasksToday, TaskDetails, TaskItem)
│   │   ├── Project/           # Project management components
│   │   ├── Area/              # Area CRUD components
│   │   ├── Note/              # Note CRUD components
│   │   ├── Tag/               # Tag management
│   │   ├── Inbox/             # Quick capture inbox
│   │   ├── Habits/            # Habit tracking UI
│   │   ├── Sidebar/           # Navigation sidebar
│   │   ├── Profile/           # User settings
│   │   ├── Admin/             # Admin user management
│   │   ├── Backup/            # Backup/restore UI
│   │   └── Shared/            # Reusable components (Dropdowns, DatePicker, etc.)
│   ├── store/                  # Zustand state management
│   │   └── useStore.ts        # Global store with domain sub-stores
│   ├── utils/                  # Services, API clients, helpers
│   │   ├── tasksService.ts    # Task API service
│   │   ├── projectsService.ts # Project API service
│   │   └── ...                # Other domain services
│   ├── hooks/                  # Custom React hooks
│   ├── entities/               # TypeScript interfaces/types
│   ├── contexts/               # React contexts
│   ├── config/                 # Frontend configuration
│   ├── i18n.ts                # i18next configuration
│   ├── index.tsx              # Application entry point
│   ├── App.tsx                # Root component with routing
│   └── Layout.tsx             # Main layout (sidebar + navbar)
│
├── backend/                    # Express.js API
│   ├── modules/               # Feature modules (MAIN BUSINESS LOGIC)
│   │   ├── tasks/            # Task CRUD, recurring, subtasks
│   │   │   ├── routes.js     # API endpoints
│   │   │   ├── service.js    # Business logic
│   │   │   ├── repository.js # Database queries
│   │   │   ├── middleware/   # Access control middleware
│   │   │   ├── operations/   # Complex operations (subtasks, tags)
│   │   │   └── core/         # Serializers, validators
│   │   ├── projects/         # Project management
│   │   ├── areas/            # Area operations
│   │   ├── notes/            # Note management
│   │   ├── tags/             # Tag operations
│   │   ├── habits/           # Habit tracking
│   │   ├── inbox/            # Inbox processing with NLP
│   │   ├── shares/           # Project sharing/collaboration
│   │   ├── users/            # User profile, API tokens
│   │   ├── admin/            # User management (admin only)
│   │   ├── auth/             # Login, register, sessions
│   │   ├── telegram/         # Telegram bot integration
│   │   ├── search/           # Universal search
│   │   ├── views/            # Saved custom views
│   │   ├── backup/           # Backup and restore
│   │   └── notifications/    # Notification preferences
│   ├── models/                # Sequelize database models
│   │   ├── index.js          # Model initialization
│   │   ├── user.js           # User model
│   │   ├── task.js           # Task model (complex, 400+ lines)
│   │   ├── project.js        # Project model
│   │   ├── area.js           # Area model
│   │   ├── note.js           # Note model
│   │   ├── tag.js            # Tag model
│   │   ├── permission.js     # Sharing permissions
│   │   └── ...               # Other models
│   ├── services/              # Shared services
│   │   └── permissionsService.js  # Access control logic
│   ├── middleware/            # Express middleware
│   │   ├── auth.js           # Authentication middleware
│   │   └── rateLimiter.js    # Rate limiting
│   ├── migrations/            # Database migrations (60+ files)
│   ├── config/                # Configuration
│   │   ├── config.js         # Centralized config
│   │   ├── database.js       # Sequelize config
│   │   └── swagger.js        # OpenAPI config
│   ├── shared/                # Shared utilities
│   ├── scripts/               # DB scripts (init, migrate, seed)
│   ├── tests/                 # Jest tests
│   │   ├── unit/             # Unit tests
│   │   └── integration/      # API tests
│   ├── db/                    # SQLite database files
│   ├── uploads/               # User uploaded files
│   └── app.js                 # Express entry point
│
├── public/                     # Static assets
│   ├── locales/               # i18n translations (24 languages)
│   │   ├── en/               # English (source of truth)
│   │   ├── es/, de/, fr/...  # Other languages
│   └── banners/               # Project banner images
│
├── e2e/                        # Playwright E2E tests
│   ├── tests/                 # Test specs
│   └── helpers/               # Test utilities
│
├── scripts/                    # Dev/deployment scripts
├── docs/                       # Documentation
│   ├── CODE_ORGANIZATION.md   # Detailed architecture guide
│   └── DEV_SETUP.md          # Development setup
│
├── package.json               # Dependencies and scripts
├── webpack.config.js          # Frontend bundler config
├── tailwind.config.js         # TailwindCSS config
├── tsconfig.json              # TypeScript config
└── Dockerfile                 # Container build
```

---

## Key Files Reference

### Entry Points

| File                      | Purpose                                 |
| ------------------------- | --------------------------------------- |
| `frontend/index.tsx`      | React app bootstrap                     |
| `frontend/App.tsx`        | Root component, routing setup           |
| `backend/app.js`          | Express server initialization           |
| `backend/models/index.js` | Sequelize initialization, model loading |

### Core Business Logic

| File                                            | Description                              | Lines |
| ----------------------------------------------- | ---------------------------------------- | ----- |
| `frontend/store/useStore.ts`                    | Zustand global state (all domain stores) | ~800  |
| `backend/modules/tasks/routes.js`               | Task API endpoints                       | ~900  |
| `backend/modules/tasks/service.js`              | Task business logic                      | ~400  |
| `backend/modules/tasks/recurringTaskService.js` | Recurring task calculations              | ~255  |
| `backend/services/permissionsService.js`        | Permission/access control                | ~180  |
| `backend/modules/projects/service.js`           | Project management logic                 | ~330  |
| `backend/modules/shares/service.js`             | Collaboration & sharing                  | ~190  |

### Database Models

| File                           | Model      | Key Fields                                                        |
| ------------------------------ | ---------- | ----------------------------------------------------------------- |
| `backend/models/user.js`       | User       | email, password_digest, settings (JSON), telegram config          |
| `backend/models/task.js`       | Task       | name, status, priority, due_date, recurrence fields, habit fields |
| `backend/models/project.js`    | Project    | name, status, area_id, settings                                   |
| `backend/models/area.js`       | Area       | name, user_id                                                     |
| `backend/models/note.js`       | Note       | title, content, project_id                                        |
| `backend/models/tag.js`        | Tag        | name, user_id                                                     |
| `backend/models/permission.js` | Permission | user_id, resource_type, resource_uid, access_level                |

### Configuration Files

| File                         | Purpose                                          |
| ---------------------------- | ------------------------------------------------ |
| `backend/.env`               | Environment variables (copy from `.env.example`) |
| `backend/config/config.js`   | Centralized backend configuration                |
| `backend/config/database.js` | Sequelize database config                        |
| `webpack.config.js`          | Webpack bundler setup                            |
| `tailwind.config.js`         | TailwindCSS theme                                |
| `tsconfig.json`              | TypeScript compiler options                      |

---

## Development Workflows

### Adding a New API Endpoint

**Example: Adding a new endpoint to tasks module**

1. **Add route in `backend/modules/tasks/routes.js`:**

```javascript
// GET /api/v1/tasks/custom-endpoint
router.get('/tasks/custom-endpoint', async (req, res) => {
    try {
        const result = await taskService.customMethod(req.user.uid);
        res.json({ result });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
```

2. **Add service method in `backend/modules/tasks/service.js`:**

```javascript
async function customMethod(userUid) {
  // Business logic here
  const tasks = await taskRepository.findCustom(userUid);
  return tasks.map(serializeTask);
}

module.exports = { ..., customMethod };
```

3. **Add repository method in `backend/modules/tasks/repository.js`:**

```javascript
async function findCustom(userUid) {
  const user = await User.findOne({ where: { uid: userUid } });
  return await Task.findAll({
    where: { user_id: user.id, /* custom conditions */ },
    include: [{ model: Tag }, { model: Project }]
  });
}

module.exports = { ..., findCustom };
```

4. **Add Swagger documentation in `backend/config/swagger.js`** (optional but recommended).

### Adding a New React Component

1. **Create component file in appropriate folder:**

```typescript
// frontend/components/Task/TaskCustomView.tsx
import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useStore from '@/store/useStore';

interface TaskCustomViewProps {
  projectUid?: string;
}

export function TaskCustomView({ projectUid }: TaskCustomViewProps) {
  const { t } = useTranslation();
  const { tasks, loadTasks } = useStore(state => state.tasksStore);

  useEffect(() => {
    loadTasks({ project: projectUid });
  }, [projectUid]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">{t('tasks.customView.title')}</h1>
      {/* Component content */}
    </div>
  );
}
```

2. **Add route in `frontend/App.tsx`:**

```typescript
<Route path="/tasks/custom" element={<TaskCustomView />} />
```

3. **Add translations in `public/locales/en/translation.json`:**

```json
{
    "tasks": {
        "customView": {
            "title": "Custom View"
        }
    }
}
```

### Adding a Database Field/Migration

1. **Create migration:**

```bash
npm run migration:create -- --name add-custom-field-to-tasks
```

2. **Edit migration file (`backend/migrations/YYYYMMDDHHMMSS-add-custom-field-to-tasks.js`):**

```javascript
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('tasks', 'custom_field', {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: null,
        });
    },
    down: async (queryInterface) => {
        await queryInterface.removeColumn('tasks', 'custom_field');
    },
};
```

3. **Update model (`backend/models/task.js`):**

```javascript
custom_field: {
  type: DataTypes.STRING,
  allowNull: true,
}
```

4. **Run migration:**

```bash
npm run migration:run
```

5. **Test rollback:**

```bash
npm run migration:undo
npm run migration:run
```

### Adding to Zustand Store

**Edit `frontend/store/useStore.ts`:**

```typescript
// Add to existing store
customStore: {
  items: [] as CustomItem[],
  isLoading: false,
  hasLoaded: false,

  loadItems: async () => {
    if (get().customStore.hasLoaded) return;

    set(state => ({
      customStore: { ...state.customStore, isLoading: true }
    }));

    try {
      const response = await customService.getItems();
      set(state => ({
        customStore: {
          ...state.customStore,
          items: response.items,
          isLoading: false,
          hasLoaded: true
        }
      }));
    } catch (error) {
      set(state => ({
        customStore: { ...state.customStore, isLoading: false }
      }));
    }
  },

  createItem: async (data: CreateItemData) => {
    const response = await customService.createItem(data);
    set(state => ({
      customStore: {
        ...state.customStore,
        items: [...state.customStore.items, response.item]
      }
    }));
    return response.item;
  },
}
```

### Adding Translations

1. **Add keys to English (source of truth):**

```json
// public/locales/en/translation.json
{
    "feature": {
        "title": "Feature Title",
        "description": "Feature description text",
        "button": {
            "save": "Save",
            "cancel": "Cancel"
        }
    }
}
```

2. **Use in component:**

```typescript
const { t } = useTranslation();
return <h1>{t('feature.title')}</h1>;
```

3. **Sync translations (if script exists):**

```bash
npm run translations:sync
```

**Note:** All user-facing text MUST use i18n. Never hardcode strings in components.

---

## Architecture Patterns

### Backend Module Structure

Every feature module in `backend/modules/{feature}/` follows this structure:

```
{feature}/
├── routes.js          # Express route definitions
├── service.js         # Business logic layer
├── repository.js      # Database query layer
├── middleware/        # Feature-specific middleware
│   └── access.js     # Permission checks
├── operations/        # Complex multi-step operations (optional)
│   ├── subtasks.js
│   └── tags.js
└── core/             # Utilities (optional)
    ├── serializers.js # DB model → API response
    └── validators.js  # Input validation
```

### Frontend Service Pattern

All API calls go through service modules:

```typescript
// frontend/utils/tasksService.ts
export const tasksService = {
    async getTasks(params?: TaskQueryParams) {
        const query = params
            ? new URLSearchParams(params as any).toString()
            : '';
        const response = await fetch(`/api/v1/tasks?${query}`, {
            credentials: 'include', // IMPORTANT: Include session cookie
        });
        if (!response.ok) throw new Error('Failed to fetch tasks');
        return response.json();
    },

    async createTask(taskData: CreateTaskData) {
        const response = await fetch('/api/v1/task', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(taskData),
        });
        if (!response.ok) throw new Error('Failed to create task');
        return response.json();
    },
};
```

### Permission System

**Access Levels:**
| Level | Value | Capabilities |
|-------|-------|--------------|
| None | 0 | No access |
| Read-Only | 1 | View only |
| Read-Write | 2 | View + edit + create |
| Admin | 3 | Full control + manage sharing |

**Permission Check Order:**

1. Is user admin? → Grant ADMIN
2. Does user own resource? → Grant RW
3. Is resource in owned/shared project? → Inherit project permissions
4. Does direct permission exist? → Grant specified level
5. Otherwise → Grant NONE

**Usage in routes:**

```javascript
const {
    requireAccess,
    ACCESS_LEVELS,
} = require('../../services/permissionsService');

// Require read-write access to task
router.patch(
    '/task/:uid',
    requireAccess('task', 'uid', ACCESS_LEVELS.RW),
    async (req, res) => {
        /* ... */
    }
);
```

### Task Status Values

```javascript
const STATUS = {
    ACTIVE: 0, // Active task
    SOMEDAY: 1, // Someday/maybe list
    WAITING: 2, // Waiting for something
    COMPLETED: 3, // Done
    DEFERRED: 4, // Deferred to future date
    PLANNED: 5, // Planned but not started
    IN_PROGRESS: 6, // Currently working on
};
```

### Priority Values

```javascript
const PRIORITY = {
    NONE: 0,
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
};
```

---

## Testing

### Running Tests

```bash
# Backend tests (Jest)
npm run backend:test              # Run all backend tests
npm run backend:test:unit         # Unit tests only
npm run backend:test:integration  # Integration tests only
npm run backend:test:coverage     # With coverage report
npm run backend:test:watch        # Watch mode

# Frontend tests (Jest + React Testing Library)
npm run frontend:test             # Run frontend tests
npm run frontend:test:coverage    # With coverage
npm run frontend:test:watch       # Watch mode

# E2E tests (Playwright)
npm run test:ui                   # Headless mode
npm run test:ui:headed            # Visible browser
npm run test:ui:mode              # Interactive UI mode
```

### Test File Locations

| Type                | Location                     | Naming       |
| ------------------- | ---------------------------- | ------------ |
| Backend unit        | `backend/tests/unit/`        | `*.test.js`  |
| Backend integration | `backend/tests/integration/` | `*.test.js`  |
| Frontend            | Next to components           | `*.test.tsx` |
| E2E                 | `e2e/tests/`                 | `*.spec.ts`  |

### Writing Tests

**Backend test example:**

```javascript
// backend/tests/integration/tasks.test.js
const request = require('supertest');
const app = require('../../app');

describe('Tasks API', () => {
    it('should create a task', async () => {
        const response = await request(app)
            .post('/api/v1/task')
            .set('Cookie', authCookie)
            .send({ name: 'Test Task', priority: 1 })
            .expect(200);

        expect(response.body.task.name).toBe('Test Task');
    });
});
```

**Frontend test example:**

```typescript
// frontend/components/Task/TaskItem.test.tsx
import { render, screen } from '@testing-library/react';
import { TaskItem } from './TaskItem';

describe('TaskItem', () => {
  it('renders task name', () => {
    const task = { uid: '1', name: 'Test Task', status: 0 };
    render(<TaskItem task={task} />);
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });
});
```

---

## Code Style & Conventions

### TypeScript

- Use strict mode
- Prefer interfaces for object shapes
- Use explicit return types for functions
- Avoid `any` type - use `unknown` if type is truly unknown
- Define types in `frontend/entities/` for shared types

### React

- Functional components only (no class components)
- Use hooks for state and effects
- Keep components focused (single responsibility)
- Extract reusable logic to custom hooks in `frontend/hooks/`
- Use `useTranslation()` for all user-facing text

### File Naming

| Type       | Convention                      | Example                   |
| ---------- | ------------------------------- | ------------------------- |
| Components | PascalCase                      | `TaskList.tsx`            |
| Utilities  | camelCase                       | `dateHelpers.ts`          |
| Hooks      | camelCase with `use` prefix     | `useKeyboardShortcuts.ts` |
| Services   | camelCase with `Service` suffix | `tasksService.ts`         |
| Constants  | UPPER_SNAKE_CASE                | `API_BASE_URL`            |

### Import Order

```typescript
// 1. React and external libraries
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

// 2. Internal utilities and services
import { tasksService } from '@/utils/tasksService';
import useStore from '@/store/useStore';

// 3. Components
import { TaskItem } from './TaskItem';
import { Button } from '@/components/Shared/Button';

// 4. Types
import type { Task } from '@/entities/Task';

// 5. Styles (if separate)
import styles from './TaskList.module.css';
```

### Backend JavaScript

- Use async/await (no callbacks)
- Use `const` by default, `let` when reassignment needed
- Validate input at route level
- Handle errors with try/catch and meaningful error messages
- Use Sequelize models for all database access

---

## Important Constraints

### Authentication

- All `/api/v1/*` routes require authentication (except `/api/login`, `/api/register`)
- Session-based auth with HTTP-only cookies (primary)
- Bearer token auth for API access (secondary)
- Always include `credentials: 'include'` in frontend fetch calls

### Permissions

- Users can only access their own data by default
- Project sharing grants access to contained tasks/notes
- Check permissions before any data modification
- Use `permissionsService.getAccess()` for permission checks

### Internationalization (i18n)

- **ALL user-facing text must use translation keys**
- Never hardcode strings in React components
- English is the source of truth (`public/locales/en/translation.json`)
- 24 languages supported - adding new keys requires translation sync

### Security

- Never commit `.env` files or secrets
- Validate and sanitize all user input
- Use parameterized queries (Sequelize handles this)
- Rate limiting is applied to all API routes
- Passwords hashed with bcrypt

### Database

- SQLite is the only supported database
- All schema changes require migrations
- Never modify released migrations - create new ones
- Migrations must have both `up` and `down` methods
- Use transactions for complex data operations

---

## Commands Reference

### Development

```bash
npm start                  # Start both frontend and backend
npm run frontend:dev       # Frontend dev server (port 8080)
npm run backend:dev        # Backend dev server (port 3002, nodemon)
npm run lint               # Run ESLint on all code
npm run lint:fix           # Auto-fix linting issues
npm run format:fix         # Auto-format with Prettier
```

### Database

```bash
npm run db:init            # Initialize database
npm run db:migrate         # Run pending migrations
npm run db:reset           # Reset database (DELETES DATA!)
npm run db:seed            # Seed development data
npm run migration:create   # Create new migration
npm run migration:run      # Apply migrations
npm run migration:undo     # Rollback last migration
npm run migration:status   # Check migration status
npm run user:create        # Create new user
```

### Testing

```bash
npm run backend:test       # Run backend tests
npm run frontend:test      # Run frontend tests
npm run test:ui            # Run E2E tests
npm run test:ui:mode       # Playwright UI mode
npm run backend:test:coverage  # Backend coverage report
```

### Build & Deploy

```bash
npm run build              # Build frontend for production
npm run docker:test-build  # Test Docker build
npm run pre-push           # Run before pushing (lint + test)
npm run pre-release        # Full verification suite
```

---

## Common Patterns

### Fetching Data in Components

```typescript
function TaskList() {
  const { tasks, loadTasks, isLoading } = useStore(state => state.tasksStore);

  useEffect(() => {
    loadTasks({ status: 'active' });
  }, []);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      {tasks.map(task => (
        <TaskItem key={task.uid} task={task} />
      ))}
    </div>
  );
}
```

### Handling Form Submissions

```typescript
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
        await tasksStore.createTask({
            name: taskName,
            priority: selectedPriority,
            project_uid: selectedProjectUid,
        });
        toast.success(t('tasks.created'));
        onClose();
    } catch (error) {
        toast.error(t('errors.createFailed'));
    } finally {
        setIsSubmitting(false);
    }
};
```

### API Error Handling (Backend)

```javascript
router.post('/task', async (req, res) => {
    try {
        const task = await taskService.createTask(req.body, req.user.uid);
        res.json({ task });
    } catch (error) {
        if (error instanceof ValidationError) {
            return res
                .status(400)
                .json({ error: error.message, code: 'VALIDATION_ERROR' });
        }
        if (error instanceof ForbiddenError) {
            return res
                .status(403)
                .json({ error: 'Access denied', code: 'FORBIDDEN' });
        }
        console.error('Task creation failed:', error);
        res.status(500).json({
            error: 'Internal server error',
            code: 'SERVER_ERROR',
        });
    }
});
```

---

## Troubleshooting

| Issue               | Solution                                                    |
| ------------------- | ----------------------------------------------------------- | -------------- |
| Port in use         | `lsof -ti:8080,3002                                         | xargs kill -9` |
| Database errors     | `npm run db:reset` (loses data!)                            |
| Module not found    | `rm -rf node_modules && npm install`                        |
| Hot reload broken   | Restart both servers, clear browser cache                   |
| Migration failed    | Check migration file, `npm run migration:undo`, fix, re-run |
| Permission denied   | Check `permissionsService.js` logic, verify user ownership  |
| Translation missing | Add key to `public/locales/en/translation.json`             |

---

## Additional Resources

- **Detailed Architecture:** `docs/CODE_ORGANIZATION.md` (2000+ lines)
- **Development Setup:** `docs/DEV_SETUP.md`
- **Contributing Guide:** `.github/CONTRIBUTING.md`
- **Security Policy:** `SECURITY.md`
- **API Documentation:** `/api-docs` (Swagger UI, requires auth)
- **External Docs:** [docs.tududi.com](https://docs.tududi.com)

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Codebase Version:** v0.88.x
