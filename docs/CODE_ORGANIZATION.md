# Tududi - Code Organization & Architecture

> **Comprehensive guide to the tududi codebase structure, tech stack, and core logic**

## Table of Contents

1. [Introduction](#introduction)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Architecture Overview](#architecture-overview)
5. [Frontend Architecture](#frontend-architecture)
6. [Backend Architecture](#backend-architecture)
7. [Database Design](#database-design)
8. [Core Features Implementation](#core-features-implementation)
9. [Key Technical Concepts](#key-technical-concepts)
10. [Development Guidelines](#development-guidelines)
11. [File Reference Guide](#file-reference-guide)

---

## Introduction

**Tududi** is a self-hosted, full-stack task management application built with modern web technologies. It provides a comprehensive productivity system with hierarchical task organization, recurring tasks, project collaboration, and multi-channel access (web UI, REST API, Telegram).

### Philosophy

Tududi follows the **PARA method** (Projects, Areas, Resources, Archives) combined with GTD (Getting Things Done) principles, providing:

- **Clear hierarchical structure**: Tasks -> Projects -> Areas
- **Flexible organization**: Tags, notes, and custom views
- **Smart automation**: Recurring tasks, inbox processing, habits tracking
- **Privacy-first**: Self-hosted with full data control
- **Multi-language support**: 24 languages with full i18n

### Document Scope

This guide provides a high-level overview of:

- How the codebase is organized
- The technologies used and why
- How core features are implemented
- Where to find specific functionality
- Best practices for development

---

## Tech Stack

### Frontend

| Technology         | Version | Purpose                                                |
| ------------------ | ------- | ------------------------------------------------------ |
| **React**          | 18.3.1  | UI framework with modern hooks and concurrent features |
| **TypeScript**     | 5.6.2   | Type safety and improved developer experience          |
| **Zustand**        | 5.0.3   | Lightweight state management (simpler than Redux)      |
| **React Router**   | 6.26.2  | Client-side routing with nested routes                 |
| **SWR**            | 2.2.5   | Data fetching and caching (stale-while-revalidate)     |
| **TailwindCSS**    | 3.4.13  | Utility-first CSS framework for rapid UI development   |
| **i18next**        | -       | Internationalization with 24 language support          |
| **React Markdown** | 10.1.0  | Markdown rendering for notes with syntax highlighting  |
| **@dnd-kit**       | 6.3.1   | Drag-and-drop for task reordering                      |
| **date-fns**       | 4.1.0   | Modern date manipulation library                       |
| **Recharts**       | 2.15.4  | Charting library for productivity metrics              |

### Backend

| Technology             | Version | Purpose                                              |
| ---------------------- | ------- | ---------------------------------------------------- |
| **Node.js**            | -       | JavaScript runtime environment                       |
| **Express.js**         | 4.21.2  | Minimalist web framework for REST API                |
| **Sequelize**          | 6.37.7  | Promise-based ORM for database operations            |
| **SQLite**             | 5.1.7   | Embedded relational database (simple deployment)     |
| **bcrypt**             | 6.0.0   | Password hashing with salt rounds                    |
| **express-session**    | 1.18.1  | Session management with cookie-based auth            |
| **Helmet**             | 8.1.0   | Security middleware (headers, XSS protection)        |
| **express-rate-limit** | 8.2.1   | Rate limiting for API protection                     |
| **node-cron**          | 4.1.0   | Task scheduler for recurring tasks and notifications |
| **nodemailer**         | 7.0.10  | Email notifications                                  |
| **web-push**           | 3.6.7   | Push notifications for web browsers                  |
| **swagger-jsdoc**      | 6.2.8   | OpenAPI documentation generation                     |

### Build Tools & Utilities

| Tool                  | Purpose                                              |
| --------------------- | ---------------------------------------------------- |
| **Webpack** 5.95.0    | Module bundler with dev server and HMR               |
| **SWC** 1.13.3        | Fast TypeScript/JavaScript compiler (replaces Babel) |
| **Jest** 29.0.0       | Testing framework for unit and integration tests     |
| **Playwright** 1.57.0 | E2E testing with cross-browser support               |
| **ESLint** 8.0.0      | Code linting with TypeScript support                 |
| **Prettier** 3.6.2    | Code formatting for consistency                      |

---

## Project Structure

### High-Level Directory Tree

```
tududi/
|-- frontend/               # React TypeScript frontend application
|   |-- components/        # React components organized by feature
|   |-- store/            # Zustand state management stores
|   |-- utils/            # Service layers, API clients, helpers
|   |-- hooks/            # Custom React hooks
|   |-- i18n.ts           # i18next configuration
|   |-- index.tsx         # Application entry point
|   +-- App.tsx           # Root component with routing
|
|-- backend/               # Express.js backend API
|   |-- modules/          # Feature modules (tasks, projects, etc.)
|   |-- models/           # Sequelize database models
|   |-- services/         # Business logic services
|   |-- middleware/       # Express middleware (auth, rate limiting)
|   |-- migrations/       # Database migration files
|   |-- config/           # Configuration files (DB, Swagger)
|   |-- shared/           # Shared utilities and helpers
|   |-- cmd/              # Startup scripts
|   +-- app.js            # Express application entry point
|
|-- public/                # Static assets and localization files
|   |-- locales/          # Translation files for 24 languages
|   |-- banners/          # Project banner images
|   +-- *.png             # Icons and logos
|
|-- e2e/                   # End-to-end Playwright tests
|-- scripts/               # Development and deployment scripts
|-- docs/                  # Documentation files
|-- webpack.config.js      # Webpack bundler configuration
|-- tailwind.config.js     # TailwindCSS theme configuration
|-- tsconfig.json          # TypeScript compiler options
+-- package.json           # Dependencies and npm scripts
```

### Key Directories Explained

#### Frontend Components (`frontend/components/`)

```
components/
|-- Task/                 # Task-related components (21 files)
|   |-- TasksToday.tsx   # Main dashboard with today's tasks
|   |-- TaskDetails.tsx  # Task detail modal with full CRUD
|   |-- TaskItem.tsx     # Individual task list item
|   |-- GroupedTaskList.tsx  # Task list with grouping logic
|   +-- RecurrenceDisplay.tsx  # Recurring task pattern display
|
|-- Project/             # Project management (10 files)
|   |-- ProjectDetails.tsx     # Project detail page
|   |-- ProjectShareModal.tsx  # Collaboration & sharing UI
|   +-- ProjectInsightsPanel.tsx  # Metrics & analytics
|
|-- Shared/              # Reusable UI components (30+ files)
|   |-- Dropdowns/       # Project, Priority, Status dropdowns
|   |-- DatePicker.tsx   # Custom date picker
|   |-- MarkdownRenderer.tsx  # Markdown preview
|   +-- UniversalSearch/ # Global search component
|
|-- Sidebar/             # Navigation sidebar components
|-- Inbox/               # Quick capture & inbox processing
|-- Habits/              # Habit tracking UI
|-- Note/                # Note CRUD components
|-- Tag/                 # Tag management
+-- Area/                # Area management
```

#### Backend Modules (`backend/modules/`)

Each module follows a consistent structure:

```
modules/{feature}/
|-- routes.js            # Express route definitions
|-- service.js           # Business logic layer
|-- repository.js        # Database query layer
|-- middleware/          # Feature-specific middleware
|   +-- access.js       # Permission checks
+-- operations/          # Complex operations (optional)
    |-- subtasks.js
    +-- tags.js
```

**Available Modules:**

- `tasks/` - Task CRUD, recurring tasks, subtasks, metrics
- `projects/` - Project management, banner uploads
- `areas/` - Area CRUD operations
- `notes/` - Note management
- `tags/` - Tag operations
- `habits/` - Habit tracking and streak calculation
- `inbox/` - Inbox processing with NLP parsing
- `shares/` - Project sharing and collaboration
- `users/` - User profile, settings, API tokens
- `admin/` - User management (admin-only)
- `telegram/` - Telegram bot integration
- `search/` - Universal search across resources
- `views/` - Saved custom views
- `backup/` - Backup and restore functionality
- `notifications/` - Notification preferences and delivery

---

## Architecture Overview

### System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        Browser[Web Browser]
        TG[Telegram App]
    end

    subgraph "Frontend Layer"
        React[React App<br/>Port 8080]
        Router[React Router]
        Store[Zustand Store]
    end

    subgraph "Backend Layer"
        Express[Express Server<br/>Port 3002]
        Auth[Auth Middleware]
        API[REST API Routes]
        Services[Business Services]
        Scheduler[Node-Cron Scheduler]
    end

    subgraph "Data Layer"
        Sequelize[Sequelize ORM]
        SQLite[(SQLite Database)]
        FileStore[File Storage<br/>uploads/]
    end

    subgraph "External Services"
        Email[SMTP Email]
        Push[Web Push Service]
        TGBot[Telegram Bot API]
    end

    Browser --> React
    React --> Router
    React --> Store
    Store --> API

    TG --> TGBot
    TGBot --> Express

    React --> Express
    Express --> Auth
    Auth --> API
    API --> Services
    Services --> Sequelize
    Sequelize --> SQLite
    Services --> FileStore

    Scheduler --> Services
    Services --> Email
    Services --> Push
    Services --> TGBot
```

### Request/Response Flow

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant F as Frontend (React)
    participant E as Express Server
    participant M as Middleware Stack
    participant S as Service Layer
    participant R as Repository Layer
    participant D as Database (SQLite)

    U->>F: Interact with UI
    F->>F: Update Zustand Store (optimistic)
    F->>E: HTTP Request (with session cookie)
    E->>M: Pass through middleware
    M->>M: Session validation
    M->>M: Rate limiting check
    M->>M: Authentication check
    E->>S: Route handler calls service
    S->>S: Business logic & validation
    S->>R: Query database
    R->>D: Execute SQL via Sequelize
    D-->>R: Return rows
    R-->>S: Return models
    S-->>E: Return formatted response
    E-->>F: JSON response
    F->>F: Update Zustand Store (confirmed)
    F-->>U: Render updated UI
```

### Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant E as Express
    participant S as Session Store
    participant D as Database

    U->>F: Enter credentials
    F->>E: POST /api/login
    E->>D: Verify user & password (bcrypt)
    D-->>E: User record
    E->>S: Create session
    S-->>E: Session ID
    E-->>F: Set-Cookie: session_id (HTTP-only)
    F-->>U: Redirect to /today

    Note over U,D: Subsequent Requests

    U->>F: Access protected route
    F->>E: API request (with cookie)
    E->>S: Validate session
    S-->>E: Session data
    E->>E: Attach user to req.user
    E-->>F: Authorized response
```

---

## Frontend Architecture

### Component Hierarchy

```
App (frontend/App.tsx)
|-- AuthProvider (session management)
|-- I18nextProvider (translations)
|-- ToastProvider (notifications)
|-- TelegramStatusProvider
+-- BrowserRouter
    |-- Layout (sidebar + navbar)
    |   |-- Sidebar
    |   |   |-- SidebarProjects
    |   |   |-- SidebarAreas
    |   |   |-- SidebarTags
    |   |   |-- SidebarHabits
    |   |   +-- SidebarViews
    |   |-- Navbar (search, user menu)
    |   +-- Routes
    |       |-- /today -> TasksToday
    |       |-- /upcoming -> TasksUpcoming
    |       |-- /tasks -> TasksList
    |       |-- /project/:uid -> ProjectDetails
    |       |-- /task/:uid -> TaskDetails (modal)
    |       |-- /inbox -> InboxList
    |       |-- /habits -> HabitsList
    |       |-- /notes -> NotesList
    |       |-- /tags -> TagsList
    |       |-- /areas -> AreasList
    |       |-- /views -> ViewsList
    |       |-- /calendar -> CalendarView
    |       |-- /profile -> UserProfile
    |       +-- /admin/users -> UserManagement (admin)
    +-- Modals (global state-controlled)
        |-- CreateTaskModal
        |-- CreateProjectModal
        |-- CreateNoteModal
        |-- CreateAreaModal
        +-- CreateTagModal
```

### State Management (Zustand)

**Store Location:** `frontend/store/useStore.ts`

Tududi uses **Zustand** for global state management, chosen for its simplicity and minimal boilerplate compared to Redux.

#### Store Structure

```typescript
const useStore = create((set, get) => ({
    // Tasks Store
    tasksStore: {
        tasks: [],
        isLoading: false,
        isError: false,
        hasLoaded: false,
        loadTasks: async (params) => {
            /* ... */
        },
        createTask: async (taskData) => {
            /* ... */
        },
        updateTask: async (uid, updates) => {
            /* ... */
        },
        deleteTask: async (uid) => {
            /* ... */
        },
        toggleTaskCompletion: async (uid) => {
            /* ... */
        },
        loadSubtasks: async (parentUid) => {
            /* ... */
        },
    },

    // Projects Store
    projectsStore: {
        projects: [],
        currentProject: null,
        isLoading: false,
        // ... similar CRUD methods
    },

    // Areas Store
    areasStore: {
        /* ... */
    },

    // Tags Store
    tagsStore: {
        /* ... */
    },

    // Notes Store
    notesStore: {
        /* ... */
    },

    // Inbox Store
    inboxStore: {
        /* ... */
    },

    // Habits Store
    habitsStore: {
        /* ... */
    },
}));
```

#### Key Features

- **Lazy Loading**: `hasLoaded` flag prevents redundant API calls
- **Optimistic Updates**: UI updates immediately, rollback on error
- **Error Handling**: `isError` state for error boundaries
- **Global Access**: Any component can read/write via `useStore()`

#### Usage Example

```typescript
// In a component
import useStore from '@/store/useStore';

function TaskList() {
  const { tasks, loadTasks } = useStore(state => state.tasksStore);

  useEffect(() => {
    loadTasks({ status: 'active' });
  }, []);

  return <div>{tasks.map(task => <TaskItem key={task.uid} task={task} />)}</div>;
}
```

### Routing Structure

**Router:** React Router v6 with nested routes

**Key Routes:**

| Path                 | Component      | Description                       |
| -------------------- | -------------- | --------------------------------- |
| `/today`             | TasksToday     | Main dashboard with today's tasks |
| `/upcoming`          | TasksUpcoming  | Tasks due in the future           |
| `/tasks`             | TasksList      | All active tasks                  |
| `/inbox`             | InboxList      | Quick capture inbox               |
| `/habits`            | HabitsList     | Habit tracking                    |
| `/projects/:uidSlug` | ProjectDetails | Project detail page               |
| `/task/:uid`         | TaskDetails    | Task detail modal (overlay)       |
| `/notes`             | NotesList      | All notes                         |
| `/tags`              | TagsList       | Tag management                    |
| `/areas`             | AreasList      | Area management                   |
| `/views`             | ViewsList      | Saved custom views                |
| `/calendar`          | CalendarView   | Calendar view of tasks            |
| `/profile`           | UserProfile    | User settings                     |
| `/admin/users`       | UserManagement | Admin user management             |

**Route Protection:** `RequireAuth` component checks session before rendering protected routes.

### Data Fetching Patterns

#### Service Layer

All API calls go through service modules in `frontend/utils/`:

```typescript
// frontend/utils/tasksService.ts
export const tasksService = {
    async getTasks(params) {
        const query = new URLSearchParams(params).toString();
        const response = await fetch(`/api/v1/tasks?${query}`, {
            credentials: 'include',
        });
        return response.json();
    },

    async createTask(taskData) {
        const response = await fetch('/api/v1/task', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(taskData),
        });
        return response.json();
    },
    // ... more methods
};
```

#### API Token Support

For automation and external integrations, Bearer token authentication is supported:

```typescript
const response = await fetch('/api/v1/tasks', {
    headers: {
        Authorization: 'Bearer YOUR_API_TOKEN',
    },
});
```

### Key UI Features

#### 1. Today Dashboard (`components/Task/TasksToday.tsx`)

The main productivity hub showing:

- **In Progress Tasks**: Currently active tasks
- **Today Plan**: User-selected tasks for today (via `defer_until`)
- **Due Today**: Tasks with today's due date
- **Overdue Tasks**: Past-due tasks requiring attention
- **Daily Quote**: Motivational quote in user's language
- **Metrics**: Completion stats and weekly chart
- **Next Task Suggestion**: Smart recommendations

#### 2. Universal Search (`components/Shared/UniversalSearch/`)

Global search with:

- Cross-resource search (tasks, projects, notes)
- Advanced filters (priority, due date, tags, status)
- Saved views for quick access
- Filter badges showing active filters
- Keyboard shortcut (`Cmd/Ctrl + K`)

#### 3. Recurring Tasks (`components/Task/RecurrenceDisplay.tsx`)

Visual display showing:

- Recurrence pattern description (e.g., "Every 2 weeks on Monday")
- Next scheduled occurrence
- Parent-child relationship indicator
- Link to edit recurrence settings

#### 4. Project Sharing (`components/Project/ProjectShareModal.tsx`)

Collaboration UI with:

- User search and selection
- Permission levels (Read-Only / Read-Write)
- Collaborator avatars
- Share revocation

#### 5. Drag-and-Drop Reordering

Uses `@dnd-kit` for:

- Task reordering within projects
- Subtask ordering
- Sidebar item reordering

---

## Backend Architecture

### Express Application Structure

**Entry Point:** `backend/app.js`

#### Middleware Stack (Order Matters!)

```javascript
// Security & Performance
app.use(helmet());                    // Security headers
app.use(compression());               // Gzip compression
app.use(morgan('combined'));          // Request logging

// CORS Configuration
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Management
app.use(session({
  secret: SESSION_SECRET,
  store: new SequelizeStore({ db: sequelize }),
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: NODE_ENV === 'production',
    maxAge: 7 days
  }
}));

// Static Files
app.use(express.static('dist'));
app.use('/locales', express.static('public/locales'));
app.use('/uploads', express.static('backend/uploads'));

// Rate Limiting
app.use('/api', apiLimiter);          // General API limit
app.use('/api/v1', authenticatedApiLimiter);  // Stricter for authed users

// Authentication Middleware
app.use('/api/v1/*', requireAuth);    // All v1 routes require auth (except login)

// Routes
app.use('/api', authRoutes);          // Login, register, logout
app.use('/api/v1/tasks', tasksRoutes);
app.use('/api/v1/projects', projectsRoutes);
// ... more routes
```

### API Endpoint Structure

**Base URL:** `/api/v1`

#### Tasks API

| Method | Endpoint                     | Description                        | Auth |
| ------ | ---------------------------- | ---------------------------------- | ---- |
| GET    | `/tasks`                     | List tasks with filtering/grouping | Yes  |
| POST   | `/task`                      | Create new task                    | Yes  |
| GET    | `/task/:uid`                 | Get task by UID                    | Yes  |
| PATCH  | `/task/:uid`                 | Update task                        | Yes  |
| DELETE | `/task/:uid`                 | Delete task                        | Yes  |
| GET    | `/task/:uid/subtasks`        | Get subtasks                       | Yes  |
| GET    | `/task/:uid/next-iterations` | Preview recurring instances        | Yes  |
| POST   | `/task/:uid/share`           | Share task (via project)           | Yes  |
| GET    | `/tasks/metrics`             | Task completion metrics            | Yes  |

#### Projects API

| Method | Endpoint               | Description         | Auth |
| ------ | ---------------------- | ------------------- | ---- |
| GET    | `/projects`            | List projects       | Yes  |
| POST   | `/project`             | Create project      | Yes  |
| GET    | `/project/:uid`        | Get project details | Yes  |
| PATCH  | `/project/:uid`        | Update project      | Yes  |
| DELETE | `/project/:uid`        | Delete project      | Yes  |
| POST   | `/project/:uid/banner` | Upload banner image | Yes  |

#### Sharing API

| Method | Endpoint                                       | Description              | Auth |
| ------ | ---------------------------------------------- | ------------------------ | ---- |
| GET    | `/shares/:resourceType/:resourceUid`           | List shares for resource | Yes  |
| POST   | `/shares/:resourceType/:resourceUid`           | Grant access to user     | Yes  |
| DELETE | `/shares/:resourceType/:resourceUid/:shareUid` | Revoke access            | Yes  |

#### Admin API

| Method | Endpoint            | Description    | Auth  |
| ------ | ------------------- | -------------- | ----- |
| GET    | `/admin/users`      | List all users | Admin |
| POST   | `/admin/users`      | Create user    | Admin |
| PATCH  | `/admin/users/:uid` | Update user    | Admin |
| DELETE | `/admin/users/:uid` | Delete user    | Admin |

**Full API documentation:** Available at `/api-docs` (Swagger UI) after authentication.

### Service Layer Pattern

Each feature module follows a **3-layer architecture**:

```
Route Handler (routes.js)
    |
    v
Service Layer (service.js)      <- Business logic
    |
    v
Repository Layer (repository.js) <- Database queries
    |
    v
Sequelize Models (models/)
```

#### Example: Task Creation Flow

```javascript
// 1. Route Handler (backend/modules/tasks/routes.js)
router.post('/task', async (req, res) => {
    try {
        const task = await taskService.createTask(req.body, req.user.uid);
        res.json({ task });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// 2. Service Layer (backend/modules/tasks/service.js)
async function createTask(taskData, userUid) {
    // Validate project access if provided
    if (taskData.project_id) {
        const access = await permissionsService.getAccess(
            userUid,
            'project',
            taskData.project_uid
        );
        if (access < ACCESS_LEVELS.RW) throw new ForbiddenError();
    }

    // Create task via repository
    const task = await taskRepository.create({
        ...taskData,
        user_id: userId,
    });

    // Associate tags
    if (taskData.tags) {
        await updateTaskTags(task, taskData.tags, userUid);
    }

    return serializeTask(task);
}

// 3. Repository Layer (backend/modules/tasks/repository.js)
async function create(taskData) {
    return await Task.create(taskData);
}
```

### Module Organization

Each module is self-contained:

```
backend/modules/tasks/
|-- routes.js              # Express routes
|-- service.js             # Business logic
|-- repository.js          # DB queries
|-- middleware/
|   +-- access.js         # Permission checks
|-- operations/
|   |-- subtasks.js       # Subtask operations
|   +-- tags.js           # Tag associations
+-- core/
    |-- serializers.js    # Format DB -> API response
    +-- validators.js     # Input validation
```

**Benefits:**

- Easy to locate functionality
- Clear separation of concerns
- Testable in isolation
- Reusable services across routes

### Telegram Integration

#### Components

1. **Service** (`backend/modules/telegram/service.js`)
    - Bot setup and configuration
    - Start/stop polling

2. **Poller** (`backend/modules/telegram/telegramPoller.js`)
    - Long polling for messages
    - Per-user whitelist checking
    - Auto-create inbox items from messages

3. **Notification Service** (`backend/modules/telegram/telegramNotificationService.js`)
    - Send task summaries
    - Daily digest notifications

4. **Initializer** (`backend/modules/telegram/telegramInitializer.js`)
    - Auto-start polling on server boot
    - Load user configurations

#### Flow

```mermaid
sequenceDiagram
    participant U as User (Telegram)
    participant TB as Telegram Bot API
    participant P as Poller (tududi)
    participant S as Service Layer
    participant D as Database

    U->>TB: Send message
    P->>TB: Long polling (getUpdates)
    TB-->>P: New message
    P->>P: Check whitelist
    P->>S: Create inbox item
    S->>D: Save to InboxItem table
    D-->>S: Success
    S-->>P: Item created
    P->>TB: Send confirmation
    TB-->>U: "Added to inbox!"
```

---

## Database Design

### Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Task : owns
    User ||--o{ Project : owns
    User ||--o{ Area : owns
    User ||--o{ Tag : owns
    User ||--o{ Note : owns
    User ||--o{ InboxItem : owns
    User ||--o{ View : owns
    User ||--|| Role : has
    User ||--o{ Permission : grants
    User ||--o{ ApiToken : creates

    Area ||--o{ Project : contains

    Project ||--o{ Task : contains
    Project ||--o{ Note : contains
    Project }o--o{ Tag : tagged_with
    Project ||--o{ Permission : shared_via

    Task }o--|| Project : belongs_to
    Task }o--|| Task : parent_task
    Task }o--|| Task : recurring_parent
    Task ||--o{ Task : subtasks
    Task ||--o{ Task : recurring_children
    Task }o--o{ Tag : tagged_with
    Task ||--o{ TaskEvent : has_history
    Task ||--o{ TaskAttachment : has_files
    Task ||--o{ RecurringCompletion : completions

    Note }o--|| Project : belongs_to
    Note }o--o{ Tag : tagged_with

    Permission }o--|| User : granted_to
```

### Core Models

#### User Model (`backend/models/user.js`)

**Key Fields:**

- `uid` (UUID) - Public identifier
- `email` - Unique email address
- `password_digest` - Bcrypt hashed password
- `name`, `surname` - User profile
- Settings: `appearance`, `language`, `timezone`, `first_day_of_week`
- Telegram: `telegram_bot_token`, `telegram_chat_id`, `telegram_allowed_users`
- Preferences (JSON): `today_settings`, `sidebar_settings`, `ui_settings`, `notification_preferences`, `keyboard_shortcuts`

**Relationships:**

- Has many: Tasks, Projects, Areas, Tags, Notes, InboxItems, Views, Notifications
- Has one: Role

#### Task Model (`backend/models/task.js`)

**Core Fields:**

- `uid` (UUID) - Public identifier
- `name` - Task title
- `note` - Description (Markdown)
- `status` - Integer enum (0=active, 1=someday, 2=waiting, 3=completed, 4=deferred, 5=planned, 6=in_progress)
- `priority` - Integer (0=none, 1=low, 2=medium, 3=high)

**Date Fields:**

- `due_date` - Deadline
- `defer_until` - Start date (hidden until this date)
- `completed_at` - Completion timestamp

**Recurring Task Fields:**

- `recurrence_type` - daily, weekly, monthly, monthly_weekday, monthly_last_day
- `recurrence_interval` - Every N units (e.g., every 2 weeks)
- `recurrence_weekday` - Specific weekday for weekly recurrence
- `recurrence_weekdays` (JSON) - Multiple weekdays
- `recurrence_month_day` - Day of month (1-31)
- `recurrence_week_of_month` - Week number (1-4)
- `recurrence_end_date` - When to stop generating instances
- `completion_based` - Boolean (true = next from completion, false = next from due date)

**Hierarchy:**

- `parent_task_id` - For subtasks
- `recurring_parent_id` - Links to original recurring task
- `order` - Sort order within parent

**Habit Fields:**

- `habit_mode` - Boolean
- `habit_target_count` - Completions target
- `habit_frequency_period` - daily/weekly/monthly
- `habit_streak_mode` - calendar/scheduled
- `habit_flexibility_mode` - strict/flexible
- `habit_current_streak`, `habit_best_streak`, `habit_total_completions`

**Relationships:**

- Belongs to: User, Project
- Has many: Subtasks, RecurringChildren, TaskEvents, TaskAttachments, RecurringCompletions
- Many-to-many: Tags

**Indexes:**

- `(user_id, status)`
- `(user_id, status, parent_task_id)`
- `(user_id, due_date, status)`
- `(user_id, completed_at, status)`
- `(recurring_parent_id)`

#### Project Model (`backend/models/project.js`)

**Fields:**

- `uid`, `name`, `description`
- `status` - Enum (not_started, in_progress, done, waiting, cancelled, planned)
- `priority` - Integer (0-2)
- `due_date_at` - Project deadline
- `pin_to_sidebar` - Boolean
- Settings: `task_show_completed`, `task_sort_order`
- `image_url` - Banner image path

**Relationships:**

- Belongs to: User, Area
- Has many: Tasks, Notes, Permissions
- Many-to-many: Tags

#### Permission Model (`backend/models/permission.js`)

**Fields:**

- `user_id` - Who has access
- `resource_type` - 'project', 'task', 'note'
- `resource_uid` - Which resource
- `access_level` - 'none', 'ro' (read-only), 'rw' (read-write), 'admin'
- `propagation` - Whether to cascade to children
- `granted_by_user_id` - Audit trail
- `source_action_id` - Links to Action record

**Purpose:** Enables project sharing and collaboration.

### Database Optimizations

#### SQLite Configuration (`backend/models/index.js:27-35`)

```javascript
await sequelize.query('PRAGMA journal_mode=WAL'); // Write-Ahead Logging
await sequelize.query('PRAGMA synchronous=NORMAL'); // Faster writes
await sequelize.query('PRAGMA busy_timeout=5000'); // Prevent lock errors
await sequelize.query('PRAGMA cache_size=-64000'); // 64MB cache
await sequelize.query('PRAGMA temp_store=MEMORY'); // RAM for temp tables
await sequelize.query('PRAGMA mmap_size=268435456'); // 256MB memory-mapped I/O
```

**Benefits:**

- **WAL Mode**: Better concurrency (readers don't block writers)
- **Large Cache**: Reduces disk I/O
- **Memory-Mapped I/O**: Faster reads for hot data

#### Migration System

**Location:** `backend/migrations/`

**Naming Convention:** `YYYYMMDDHHMMSS-description.js`

**Example Migration:**

```javascript
module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.addColumn('tasks', 'habit_mode', {
            type: Sequelize.BOOLEAN,
            defaultValue: false,
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.removeColumn('tasks', 'habit_mode');
    },
};
```

**Commands:**

- `npm run migration:create` - Generate new migration
- `npm run migration:run` - Apply pending migrations
- `npm run migration:undo` - Rollback last migration

---

## Core Features Implementation

### 1. Task Management System

#### Task Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Active: Create Task
    Active --> InProgress: Start Working
    Active --> Deferred: Set defer_until
    Active --> Someday: Move to Someday
    Active --> Waiting: Set to Waiting
    Active --> Completed: Mark Complete

    InProgress --> Completed: Finish Task
    InProgress --> Active: Pause Work

    Deferred --> Active: defer_until reached
    Someday --> Active: Move to Active
    Waiting --> Active: Unblock

    Completed --> [*]
    Completed --> Active: Reopen Task
```

#### Task Filtering & Grouping

**Backend:** `backend/modules/tasks/routes.js:100-350`

**Supported Filters:**

- `status` - Filter by status value
- `project` - Tasks in specific project
- `tags` - Tasks with specific tags (comma-separated)
- `priority` - Filter by priority level
- `view` - Apply saved view filters
- `due` - today, overdue, upcoming, week, month, none
- `defer` - today, overdue, upcoming, none
- `recurring` - true/false
- `habit_mode` - true/false

**Grouping Options:**

- `group_by=day` - Group by due date (Today, Tomorrow, This Week, etc.)
- `group_by=week` - Group by week
- `group_by=month` - Group by month
- `group_by=project` - Group by project
- `group_by=priority` - Group by priority level
- `group_by=status` - Group by status

**Special Views:**

- `view=today` - Tasks for today's work (in_progress, today_plan, due_today, overdue)
- `view=dashboard` - Same as today but with metadata

#### Task Metrics

**Endpoint:** `GET /api/v1/tasks/metrics`

**Returns:**

- Total tasks
- Completed tasks
- Completion rate
- Tasks by priority breakdown
- Tasks by status breakdown
- Weekly completion chart data

### 2. Recurring Tasks System

#### Recurrence Patterns

**Daily:**

```javascript
recurrence_type: 'daily';
recurrence_interval: 2; // Every 2 days
```

**Weekly:**

```javascript
recurrence_type: 'weekly';
recurrence_interval: 1; // Every week
recurrence_weekday: 1; // On Monday (0=Sunday, 6=Saturday)
```

**Monthly (Specific Day):**

```javascript
recurrence_type: 'monthly';
recurrence_interval: 1;
recurrence_month_day: 15; // 15th of every month
```

**Monthly (Weekday):**

```javascript
recurrence_type: 'monthly_weekday';
recurrence_week_of_month: 2; // Second
recurrence_weekday: 1; // Monday
// = "Second Monday of every month"
```

**Monthly (Last Day):**

```javascript
recurrence_type: 'monthly_last_day';
// = Last day of every month
```

#### How Recurring Tasks Work

**Service:** `backend/modules/tasks/recurringTaskService.js`

**1. Virtual Occurrences** (for Upcoming view):

```javascript
calculateVirtualOccurrences(task, (count = 10), (startFrom = today));
```

Generates future instances without saving to DB. Used for preview.

**2. Task Generation** (via scheduler):

```javascript
// Node-cron runs daily
cron.schedule('0 0 * * *', async () => {
    const recurringTasks = await getActiveRecurringTasks();

    for (const task of recurringTasks) {
        const nextDate = calculateNextDueDate(task, task.due_date);

        if (shouldGenerateNextTask(task, nextDate)) {
            await createRecurringInstance(task, nextDate);
        }
    }
});
```

**3. Completion Handling:**

- **Completion-based** (`completion_based: true`):
    - Next due date = today + interval
    - Example: Complete "Weekly Review" on Wednesday -> next is Wednesday next week
- **Due-date-based** (`completion_based: false`):
    - Next due date = original due date + interval
    - Example: "Pay Rent" on 1st -> always 1st of month, even if paid late

**4. Parent-Child Relationship:**

- Original recurring task is the "parent"
- Generated instances are "children" (`recurring_parent_id` set)
- Editing child can update parent's recurrence pattern
- Completing child advances parent's `due_date`

### 3. Subtasks System

#### Structure

```
Parent Task
|-- Subtask 1 (order: 1)
|-- Subtask 2 (order: 2)
+-- Subtask 3 (order: 3)
```

**Implementation:** Self-referential foreign key `parent_task_id`

**Operations:** `backend/modules/tasks/operations/subtasks.js`

**Key Functions:**

- `createSubtasks(parentId, subtasks, userId)` - Batch create
- `updateSubtasks(parentId, subtasks, userId)` - Sync subtasks (update existing, create new)
- `getSubtasks(parentId, userId, timezone)` - Fetch with permissions check

**Frontend:**

- Drag-and-drop reordering updates `order` field
- Progress bar shows completion percentage
- Completing all subtasks suggests completing parent
- Expanding/collapsing in task list

### 4. Project Collaboration & Sharing

#### Permission Levels

| Level          | Value | Capabilities                  |
| -------------- | ----- | ----------------------------- |
| **None**       | 0     | No access                     |
| **Read-Only**  | 1     | View project, tasks, notes    |
| **Read-Write** | 2     | View + edit + create          |
| **Admin**      | 3     | Full control + manage sharing |

#### Sharing Flow

```mermaid
sequenceDiagram
    participant O as Owner
    participant S as Sharing Service
    participant P as Permissions Service
    participant D as Database
    participant C as Collaborator

    O->>S: Share project with user (RW)
    S->>P: Check if owner
    P-->>S: Confirmed owner
    S->>D: Create Permission record
    D-->>S: Permission created
    S->>D: Create Action record (audit)
    S-->>O: Share successful

    C->>P: Access project
    P->>D: Check permissions
    D-->>P: RW access found
    P-->>C: Access granted
```

#### Permission Propagation

**Projects can be shared directly.**  
**Tasks and notes inherit permissions from their project.**

**Query Building:** `backend/services/permissionsService.js:75-115`

```javascript
// Fetch tasks user can access
const tasks = await Task.findAll({
    where: ownershipOrPermissionWhere(userId, 'task', {
        status: 'active',
    }),
});

// Generated WHERE clause:
// (user_id = userId) OR
// (uid IN (SELECT resource_uid FROM permissions WHERE user_id = userId)) OR
// (project_id IN (SELECT id FROM projects WHERE user_id = userId)) OR
// (project_id IN (SELECT id FROM projects WHERE uid IN
//   (SELECT resource_uid FROM permissions WHERE user_id = userId)))
```

### 5. Tagging System

#### Many-to-Many Relationships

**Junction Tables:**

- `tasks_tags` (task_id, tag_id)
- `notes_tags` (note_id, tag_id)
- `projects_tags` (project_id, tag_id)

**Auto-Creation:**
Tags are created automatically when first referenced:

```javascript
// Frontend sends:
{
    tags: ['#work', '#urgent'];
}

// Backend service:
for (const tagName of tagNames) {
    const [tag] = await Tag.findOrCreate({
        where: { user_id: userId, name: tagName },
    });
    await task.addTag(tag);
}
```

**Filtering:**

```javascript
// GET /api/v1/tasks?tags=work,urgent
// Returns tasks with ANY of the tags (OR logic)

const tasks = await Task.findAll({
    include: [
        {
            model: Tag,
            where: { name: { [Op.in]: ['work', 'urgent'] } },
        },
    ],
});
```

### 6. Inbox Processing

#### Smart Parsing

**Service:** `backend/modules/inbox/inboxProcessingService.js`

**Features:**

1. **Tag Detection**: Extracts `#hashtags` from content
2. **Project Detection**: Extracts `@project` mentions
3. **Content Cleaning**: Removes detected tags/projects
4. **NLP Suggestions**: Uses `compromise` library for intent detection

**Example:**

```
Input: "Call dentist #health @personal urgent"

Processed:
{
  title: "Call dentist urgent",
  content: "Call dentist #health @personal urgent",
  cleaned_content: "Call dentist urgent",
  parsed_tags: ["health"],
  parsed_projects: ["personal"],
  suggested_type: "task",
  suggested_reason: "Contains action verb 'call'"
}
```

**Frontend Flow:**

1. User enters quick capture
2. Backend processes and suggests
3. User sees cleaned content with tag/project chips
4. User converts to task/note with one click

### 7. Habits Tracking

#### Habit Types

**Flexibility Mode:**

- **Strict**: Must complete every scheduled day
- **Flexible**: Complete N times per period (e.g., 3 times per week)

**Streak Mode:**

- **Calendar**: Complete consecutive days
- **Scheduled**: Complete on scheduled days (e.g., Mon/Wed/Fri)

**Frequency:**

- Daily: Every day
- Weekly: N times per week
- Monthly: N times per month

#### Streak Calculation

**Service:** `backend/modules/habits/habitService.js`

**Algorithm:**

1. Fetch all completions (RecurringCompletion records)
2. Sort by date descending
3. Iterate and check for consecutive days/scheduled days
4. Break on first gap
5. Update `habit_current_streak`

**Example (Scheduled Streak):**

```
Habit: Run (Mon/Wed/Fri)
Completions: Dec 6 (Fri), Dec 4 (Wed), Dec 2 (Mon), Nov 29 (Fri)
Current Streak: 4 (all scheduled days completed)
```

### 8. Telegram Integration

#### Setup Process

1. User creates bot via BotFather
2. User enters bot token in settings
3. Backend validates token via Telegram API
4. Backend saves token to user record
5. User sends `/start` to bot
6. Backend receives message with chat_id
7. Backend saves chat_id to user record
8. Polling starts automatically

#### Message Handling

**Poller:** `backend/modules/telegram/telegramPoller.js`

**Flow:**

1. Long polling every 1 second (`getUpdates` API)
2. Receive message
3. Check if sender is in `telegram_allowed_users` whitelist
4. Create InboxItem with message text
5. Process via inbox service (extract tags, projects)
6. Send confirmation to user

**Notifications:**

- Daily task summary (scheduled via cron)
- Due/overdue task alerts
- Custom notification preferences

---

## Key Technical Concepts

### 1. Authentication & Sessions

#### Session-Based Authentication

**Primary Method:** HTTP-only cookies with server-side sessions

**Flow:**

1. User logs in with email/password
2. Backend verifies credentials (bcrypt comparison)
3. Session created in `Sessions` table (via `connect-session-sequelize`)
4. Session ID returned as HTTP-only cookie
5. Subsequent requests include cookie automatically
6. Middleware validates session and attaches `req.user`

**Benefits:**

- Secure (HTTP-only prevents XSS)
- Automatic CSRF protection
- Server-side revocation (logout = delete session)

**Configuration:** `backend/app.js:22-73`

```javascript
app.use(
    session({
        secret: process.env.TUDUDI_SESSION_SECRET,
        store: new SequelizeStore({ db: sequelize }),
        resave: false,
        saveUninitialized: false,
        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        },
    })
);
```

#### API Token Authentication

**Secondary Method:** Bearer tokens for automation

**Generation:** User creates token via `/api/v1/users/api-tokens`

**Usage:**

```http
GET /api/v1/tasks
Authorization: Bearer tududi_xxxxxxxxxxxxxxxxxxxx
```

**Middleware:** `backend/middleware/auth.js:25-50`

```javascript
// Check for Bearer token
const authHeader = req.headers.authorization;
if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const apiToken = await ApiToken.findOne({ where: { token } });

    if (apiToken) {
        req.user = await User.findByPk(apiToken.user_id);
        await apiToken.updateLastUsed(); // Throttled to 5 min
        return next();
    }
}
```

### 2. Permission System

#### Access Level Hierarchy

```
Admin (3) > Read-Write (2) > Read-Only (1) > None (0)
```

#### Permission Check Flow

```mermaid
flowchart TD
    Start[Check Access] --> IsAdmin{Is User Admin?}
    IsAdmin -->|Yes| GrantAdmin[Grant ADMIN access]
    IsAdmin -->|No| IsOwner{Owns Resource?}
    IsOwner -->|Yes| GrantRW[Grant RW access]
    IsOwner -->|No| InProject{Resource in owned/shared project?}
    InProject -->|Yes| InheritPerms[Inherit project permissions]
    InProject -->|No| DirectShare{Direct permission exists?}
    DirectShare -->|Yes| GrantLevel[Grant specified level]
    DirectShare -->|No| DenyAccess[Grant NONE]

    GrantAdmin --> End[Return Access Level]
    GrantRW --> End
    InheritPerms --> End
    GrantLevel --> End
    DenyAccess --> End
```

**Implementation:** `backend/services/permissionsService.js`

**Key Function:**

```javascript
async function getAccess(userId, resourceType, resourceUid) {
    // 1. Check if admin
    if (await isAdmin(userId)) return ACCESS_LEVELS.ADMIN;

    // 2. Check ownership
    const resource = await findResource(resourceType, resourceUid);
    if (resource.user_id === userId) return ACCESS_LEVELS.RW;

    // 3. Check project permissions (for tasks/notes)
    if (resourceType === 'task' || resourceType === 'note') {
        if (resource.project_id) {
            const projectAccess = await getAccess(
                userId,
                'project',
                resource.project.uid
            );
            if (projectAccess > 0) return projectAccess;
        }
    }

    // 4. Check direct permission
    const permission = await Permission.findOne({
        where: {
            user_id: userId,
            resource_type: resourceType,
            resource_uid: resourceUid,
        },
    });

    if (permission) return ACCESS_LEVELS[permission.access_level.toUpperCase()];

    // 5. No access
    return ACCESS_LEVELS.NONE;
}
```

### 3. Performance Optimizations

#### Database Indexes

**Task Indexes** (`backend/models/task.js:330-358`):

```javascript
indexes: [
    { fields: ['user_id', 'status'] }, // List active tasks
    { fields: ['user_id', 'status', 'parent_task_id'] }, // List subtasks
    { fields: ['user_id', 'due_date', 'status'] }, // Due date queries
    { fields: ['user_id', 'completed_at', 'status'] }, // Completion metrics
    { fields: ['recurring_parent_id'] }, // Recurring children
    { fields: ['user_id', 'defer_until', 'status'] }, // Today plan
];
```

**Why These Indexes?**

- Most queries filter by `user_id` + `status` (multi-tenant data)
- Due date and defer date queries are frequent (Today view)
- Subtask queries need fast parent lookups
- Recurring task queries need parent->children navigation

#### Query Optimization

**Eager Loading:**

```javascript
// Bad (N+1 queries)
const tasks = await Task.findAll();
for (const task of tasks) {
    const tags = await task.getTags(); // Separate query per task
}

// Good (2 queries total)
const tasks = await Task.findAll({
    include: [{ model: Tag }],
});
```

**Pagination:**

```javascript
// For large datasets
const { rows, count } = await Task.findAndCountAll({
    where: { user_id: userId },
    limit: 50,
    offset: page * 50,
});
```

#### Caching Strategies

**Frontend (Zustand):**

- `hasLoaded` flag prevents redundant API calls
- Store caches data until explicit refresh
- Optimistic updates reduce perceived latency

**Backend:**

- Session store uses database (no in-memory cache needed)
- Static assets served with cache headers
- Gzip compression reduces bandwidth

### 4. Internationalization (i18n)

#### Setup

**Frontend:** `frontend/i18n.ts`

**Configuration:**

```javascript
i18n.use(Backend) // Load translations from /locales
    .use(LanguageDetector) // Detect user language
    .use(initReactI18next) // React bindings
    .init({
        fallbackLng: 'en',
        supportedLngs: [
            'en',
            'es',
            'de',
            'fr',
            'it',
            'pt',
            'nl',
            'ru',
            'zh',
            'jp',
            'ko',
            'ar',
            'tr',
            'el',
            'pl',
            'sv',
            'no',
            'da',
            'fi',
            'ro',
            'bg',
            'sl',
            'ua',
            'vi',
            'id',
        ],
        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json',
        },
    });
```

**Translation Files:** `public/locales/{lang}/translation.json`

**Structure:**

```json
{
    "common": {
        "save": "Save",
        "cancel": "Cancel",
        "delete": "Delete"
    },
    "tasks": {
        "create": "Create Task",
        "edit": "Edit Task",
        "due_date": "Due Date"
    }
}
```

#### Usage in Components

```typescript
import { useTranslation } from 'react-i18next';

function TaskForm() {
  const { t } = useTranslation();

  return (
    <button>{t('tasks.create')}</button>
  );
}
```

#### Language Detection Order

1. Query string (`?lng=es`)
2. Cookie (`i18next`)
3. LocalStorage (`i18nextLng`)
4. Browser language
5. Fallback to English

### 5. API Design Patterns

#### RESTful Principles

| HTTP Method | Purpose                  | Example                    |
| ----------- | ------------------------ | -------------------------- |
| GET         | Retrieve resource(s)     | `GET /api/v1/tasks`        |
| POST        | Create new resource      | `POST /api/v1/task`        |
| PATCH       | Update existing resource | `PATCH /api/v1/task/:uid`  |
| DELETE      | Remove resource          | `DELETE /api/v1/task/:uid` |

#### Response Format

**Success (200):**

```json
{
    "task": {
        "uid": "abc123",
        "name": "Complete report",
        "status": 0,
        "priority": 2,
        "due_date": "2026-01-15",
        "tags": [{ "uid": "tag1", "name": "work" }],
        "project": {
            "uid": "proj1",
            "name": "Q1 Planning"
        }
    }
}
```

**Error (400/403/404/500):**

```json
{
    "error": "Task not found",
    "code": "TASK_NOT_FOUND",
    "details": {
        "uid": "invalid123"
    }
}
```

#### Versioning

**URL-based versioning:** `/api/v1/*`

**Benefits:**

- Clear API version in URL
- Easy to maintain multiple versions
- Clients specify version explicitly

**Future:** `/api/v2/*` can coexist with `/api/v1/*`

---

## Development Guidelines

### Entry Points

#### Frontend Development

**Start Dev Server:**

```bash
npm run frontend:dev
# Webpack dev server at http://localhost:8080
# Hot module replacement enabled
```

**Main Entry:** `frontend/index.tsx` -> `frontend/App.tsx`

**Adding a New Page:**

1. Create component in `frontend/components/{Feature}/`
2. Add route in `frontend/App.tsx`
3. Add navigation link in `frontend/Layout.tsx` or sidebar

**Adding a Component:**

1. Create in appropriate folder (`components/{Feature}/`)
2. Use TypeScript with React.FC or explicit types
3. Import and use in parent component
4. Add i18n keys if needed

#### Backend Development

**Start Dev Server:**

```bash
npm run backend:dev
# Nodemon watches for changes, restarts on save
# Server at http://localhost:3002
```

**Main Entry:** `backend/app.js`

**Adding a New API Endpoint:**

1. Create module in `backend/modules/{feature}/`
2. Create `routes.js`, `service.js`, `repository.js`
3. Register routes in `backend/app.js`
4. Add Swagger docs in `backend/docs/swagger/{feature}.js`

**Example Module Structure:**

```javascript
// backend/modules/example/routes.js
const router = require('express').Router();
const exampleService = require('./service');

router.get('/examples', async (req, res) => {
    const examples = await exampleService.getExamples(req.user.uid);
    res.json({ examples });
});

module.exports = router;

// backend/modules/example/service.js
async function getExamples(userId) {
    return await exampleRepository.findByUser(userId);
}

// backend/modules/example/repository.js
const { Example } = require('../../models');

async function findByUser(userId) {
    return await Example.findAll({ where: { user_id: userId } });
}
```

### Adding New Features

#### Step-by-Step Process

**1. Database Changes:**

```bash
# Create migration
npm run migration:create -- --name add-example-feature

# Edit migration file in backend/migrations/
# Run migration
npm run migration:run
```

**2. Update Model:**

```javascript
// backend/models/example.js
module.exports = (sequelize, DataTypes) => {
    const Example = sequelize.define('Example', {
        uid: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4 },
        name: { type: DataTypes.STRING, allowNull: false },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
    });

    Example.associate = (models) => {
        Example.belongsTo(models.User, { foreignKey: 'user_id' });
    };

    return Example;
};
```

**3. Backend API:**

- Create module in `backend/modules/example/`
- Add routes, service, repository
- Add permission checks if needed
- Register in `backend/app.js`

**4. Frontend Service:**

```typescript
// frontend/utils/exampleService.ts
export const exampleService = {
    async getExamples() {
        const response = await fetch('/api/v1/examples', {
            credentials: 'include',
        });
        return response.json();
    },
};
```

**5. Zustand Store:**

```typescript
// frontend/store/useStore.ts
exampleStore: {
  examples: [],
  isLoading: false,
  async loadExamples() {
    set(state => ({
      exampleStore: { ...state.exampleStore, isLoading: true }
    }));

    const data = await exampleService.getExamples();

    set(state => ({
      exampleStore: {
        ...state.exampleStore,
        examples: data.examples,
        isLoading: false
      }
    }));
  }
}
```

**6. React Components:**

```typescript
// frontend/components/Example/ExampleList.tsx
import useStore from '@/store/useStore';

export function ExampleList() {
  const { examples, loadExamples } = useStore(state => state.exampleStore);

  useEffect(() => {
    loadExamples();
  }, []);

  return (
    <div>
      {examples.map(ex => <div key={ex.uid}>{ex.name}</div>)}
    </div>
  );
}
```

**7. Add Route:**

```typescript
// frontend/App.tsx
<Route path="/examples" element={<ExampleList />} />
```

**8. Add i18n:**

```json
// public/locales/en/translation.json
{
    "examples": {
        "title": "Examples",
        "create": "Create Example"
    }
}
```

### Testing Strategy

#### Backend Tests

**Location:** `backend/tests/`

**Structure:**

```
tests/
|-- integration/         # API endpoint tests
|   |-- tasks.test.js
|   +-- projects.test.js
+-- unit/               # Service/utility tests
    +-- recurringTaskService.test.js
```

**Running Tests:**

```bash
npm run backend:test              # All tests
npm run backend:test:watch        # Watch mode
npm run backend:test:coverage     # With coverage report
```

**Example Test:**

```javascript
const request = require('supertest');
const app = require('../app');

describe('Tasks API', () => {
    it('should create a task', async () => {
        const response = await request(app)
            .post('/api/v1/task')
            .send({ name: 'Test Task', priority: 1 })
            .expect(200);

        expect(response.body.task.name).toBe('Test Task');
    });
});
```

#### Frontend Tests

**Framework:** Jest + React Testing Library

**Running Tests:**

```bash
npm run frontend:test              # All tests
npm run frontend:test:watch        # Watch mode
npm run frontend:test:coverage     # With coverage
```

#### E2E Tests

**Framework:** Playwright

**Running Tests:**

```bash
npm run test:ui              # Headless mode
npm run test:ui:headed       # Headed mode (visible browser)
npm run test:ui:mode         # Interactive UI mode
```

### Code Conventions

#### TypeScript

- Use strict mode where possible
- Prefer interfaces for object shapes
- Use explicit return types for functions
- Avoid `any` type

#### React

- Use functional components with hooks
- Prefer composition over inheritance
- Extract reusable logic into custom hooks
- Keep components focused (single responsibility)

#### File Naming

- Components: PascalCase (`TaskList.tsx`)
- Utilities: camelCase (`dateHelpers.ts`)
- Hooks: camelCase with `use` prefix (`useKeyboardShortcuts.ts`)
- Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)

#### Import Order

```typescript
// 1. React/external libraries
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

// 2. Internal utilities/services
import { tasksService } from '@/utils/tasksService';
import useStore from '@/store/useStore';

// 3. Components
import { TaskItem } from './TaskItem';

// 4. Types
import type { Task } from '@/types';

// 5. Styles (if separate CSS modules)
import styles from './TaskList.module.css';
```

---

## File Reference Guide

### Critical Files to Know

#### Configuration

| File                         | Purpose                                         |
| ---------------------------- | ----------------------------------------------- |
| `package.json`               | Dependencies, scripts, project metadata         |
| `webpack.config.js`          | Webpack bundler configuration, dev server setup |
| `tsconfig.json`              | TypeScript compiler options                     |
| `tailwind.config.js`         | TailwindCSS theme and plugin configuration      |
| `backend/config/database.js` | Database connection configuration               |
| `backend/config/swagger.js`  | OpenAPI/Swagger documentation setup             |
| `.env.example`               | Environment variable template                   |

#### Entry Points

| File                        | Purpose                        |
| --------------------------- | ------------------------------ |
| `frontend/index.tsx:1`      | Frontend React app entry point |
| `frontend/App.tsx:1`        | Root component with routing    |
| `backend/app.js:1`          | Express server entry point     |
| `backend/models/index.js:1` | Sequelize initialization       |

#### Core Business Logic

| File                                            | Description                     | Lines |
| ----------------------------------------------- | ------------------------------- | ----- |
| `frontend/store/useStore.ts`                    | Zustand global state management | 772   |
| `backend/modules/tasks/routes.js`               | Task API endpoints              | 885   |
| `backend/modules/tasks/service.js`              | Task business logic             | ~400  |
| `backend/modules/tasks/recurringTaskService.js` | Recurring task calculations     | 255   |
| `backend/services/permissionsService.js`        | Permission/access control       | 178   |
| `backend/modules/projects/service.js`           | Project management              | 330   |
| `backend/modules/shares/service.js`             | Collaboration & sharing         | 189   |

#### Models (Database)

| File                           | Model               |
| ------------------------------ | ------------------- |
| `backend/models/user.js`       | User accounts       |
| `backend/models/task.js`       | Tasks (core entity) |
| `backend/models/project.js`    | Projects            |
| `backend/models/area.js`       | Areas               |
| `backend/models/tag.js`        | Tags                |
| `backend/models/note.js`       | Notes               |
| `backend/models/permission.js` | Sharing permissions |
| `backend/models/role.js`       | User roles          |

#### Key Components

| File                                             | Component                | Lines    |
| ------------------------------------------------ | ------------------------ | -------- |
| `frontend/components/Task/TasksToday.tsx`        | Today dashboard          | ~2000    |
| `frontend/components/Task/TaskDetails.tsx`       | Task detail modal        | ~1500    |
| `frontend/components/Project/ProjectDetails.tsx` | Project page             | ~1000    |
| `frontend/components/Shared/UniversalSearch/`    | Global search            | Multiple |
| `frontend/Layout.tsx`                            | Main layout with sidebar | 555      |

### Where to Find Things

| What                      | Where                                         |
| ------------------------- | --------------------------------------------- |
| **Add new API endpoint**  | `backend/modules/{feature}/routes.js`         |
| **Add database field**    | Create migration -> Update model              |
| **Add UI component**      | `frontend/components/{Feature}/`              |
| **Add translation**       | `public/locales/{lang}/translation.json`      |
| **Modify permissions**    | `backend/services/permissionsService.js`      |
| **Add Zustand state**     | `frontend/store/useStore.ts`                  |
| **Configure environment** | `.env` (copy from `.env.example`)             |
| **Modify task logic**     | `backend/modules/tasks/service.js`            |
| **Add middleware**        | `backend/middleware/` -> register in `app.js` |
| **Add scheduled job**     | `backend/modules/tasks/taskScheduler.js`      |

---

## Conclusion

Tududi is a **well-architected, feature-rich task management system** with:

- **Modern tech stack** (React, TypeScript, Express, Sequelize)
- **Clean architecture** (separation of concerns, modular structure)
- **Comprehensive features** (recurring tasks, collaboration, habits, multi-language)
- **Security-first** (session auth, permissions, rate limiting)
- **Performance-optimized** (database indexes, caching, lazy loading)
- **Developer-friendly** (clear conventions, good documentation, testable code)

### Next Steps for New Developers

1. **Set up development environment** (see main README)
2. **Read this document** to understand architecture
3. **Explore the codebase** starting with:
    - `frontend/App.tsx` - See how routing works
    - `backend/app.js` - Understand middleware stack
    - `backend/modules/tasks/` - Study a complete module
4. **Run the application** and play with features
5. **Read existing tests** to understand expectations
6. **Start with small changes** (UI tweaks, new translations)
7. **Gradually tackle larger features**

### Getting Help

- **Issues:** [GitHub Issues](https://github.com/chrisvel/tududi/issues)
- **Discussions:** [GitHub Discussions](https://github.com/chrisvel/tududi/discussions)
- **Discord:** [tududi Community](https://discord.gg/fkbeJ9CmcH)
- **Reddit:** [r/tududi](https://www.reddit.com/r/tududi/)

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Codebase Version:** v0.88.3-dev.5

_This documentation reflects the state of the codebase as of January 2026. For the latest updates, always refer to the main repository._
