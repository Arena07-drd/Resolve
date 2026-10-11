# Resolve Project Context & Architecture

This document provides a comprehensive overview of the Resolve codebase, architectural decisions, completed features, rules, patterns, and current status for any subsequent model, agent, or developer working on this project.

---

## 1. Project Overview

**Resolve** is a full-stack, single-tenant support-ticket management system designed with strict data isolation, ticket ownership enforcement, robust schema validation, and a clean, responsive plain-CSS user interface.

### Tech Stack
- **Backend:** Node.js (ES modules), Express 5 (`^5.3.0`), Mongoose (`^9.11.1`), MongoDB Atlas.
- **Frontend:** React 19 (`^19.2.8`), Vite (`^8.3.0`), React Router v7 (`^7.18.4`), Axios (`^1.20.0`).
- **Styling:** Plain CSS only (Strict constraint: no Tailwind, no component libraries, no animations, no complex chart packages).
- **Validation:** Zod (`^4.6.5`) on backend and client-side error parsing.
- **Authentication & Security:** JWT (`jsonwebtoken`), password hashing via `bcryptjs` (12 rounds).
- **Testing:** Vitest (`^5.0.3`) and Supertest (`^7.3.1`) for backend integration and unit tests.

---

## 2. Core Project Rules & Guidelines (`AGENTS.md`)

All modifications must adhere strictly to the rules outlined in `AGENTS.md`:

1. **Stack & UI:**
   - ES modules (`import`/`export`) everywhere.
   - Plain CSS only: Do not install or introduce Tailwind CSS, component libraries (MUI, Chakra, Radix, Shadcn), CSS keyframe animations, or chart libraries.
2. **Structure & Naming:**
   - Frontend in `client/`, backend in `server/`.
   - Backend modularity: `models/`, `routes/`, `controllers/`, `middleware/`, `validators/` (or `schemas/`), and `tests/`.
   - Clear camelCase for JS filenames, functions, and variables; PascalCase for React components and Mongoose models.
3. **Safe, Incremental Work:**
   - Inspect existing files before editing; do not overwrite working code without explaining why.
   - Make small, verifiable changes. Report changed files, commands to run, expected output, manual checks, and limitations.
   - Confirm before destructive operations or major architectural shifts.
4. **Security & Data Ownership:**
   - Hash passwords with `bcryptjs`; never store or log plaintext passwords.
   - Keep JWT secret, connection strings, and credentials only in environment variables.
   - **Never expose secrets, connection strings, or JWT keys in code, logs, prompts, or documentation.**
   - **Strict Ownership:** Enforce user ticket ownership (`createdBy: request.user._id`) on every ticket read, query, update, and delete operation.
   - Input validation: All endpoint payloads and query/route parameters must be validated with Zod.
5. **Testing & Performance Evidence:**
   - Test coverage with Vitest and Supertest covering authentication, validation, and ticket ownership.
   - Measure query performance: Benchmark the ticket-list MongoDB query with `.explain("executionStats")` before and after adding justified indexes.
   - Record only observed benchmark and test results; never fabricate results or features.

---

## 3. Repository Structure

```
d:\Resolve\
├── .gitignore                    # Ignores node_modules, dist, coverage, .env
├── AGENTS.md                     # Mandatory project rules & coding standards
├── context.md                    # This project context documentation
├── client\                       # React + Vite Frontend
│   ├── .env                      # Local environment (VITE_API_URL)
│   ├── .env.example              # Template for frontend environment
│   ├── eslint.config.js          # ESLint configuration
│   ├── index.html                # Vite HTML entry point
│   ├── package.json              # Client dependencies and scripts
│   ├── vite.config.js            # Vite configuration with React plugin
│   ├── public\                   # Static public assets (favicon.svg, icons.svg)
│   └── src\
│       ├── main.jsx              # React DOM render root with BrowserRouter
│       ├── App.jsx               # Route definitions, session state, 401 listener
│       ├── App.css               # Legacy scaffold styles
│       ├── index.css             # Main plain-CSS design system for the entire app
│       ├── assets\               # Images/logos (hero.png, react.svg, vite.svg)
│       ├── components\
│       │   ├── AppLayout.jsx     # Navigation bar, user greeting, logout button, Outlet
│       │   ├── ProtectedRoute.jsx# Auth guard redirecting to /login if unauthenticated
│       │   ├── ErrorMessage.jsx  # Reusable error banner component
│       │   ├── LoadingMessage.jsx# Reusable loading indicator
│       │   ├── TicketForm.jsx    # Form for creating/updating tickets with Zod-aligned inputs
│       │   └── TicketTable.jsx   # Data table for rendering ticket lists with badges
│       ├── pages\
│       │   ├── DashboardPage.jsx # Top 5 recent tickets, summary stats, quick create
│       │   ├── TicketListPage.jsx# Full ticket list with search, status/priority filters, pagination
│       │   ├── CreateTicketPage.jsx # Ticket creation page
│       │   ├── TicketDetailsPage.jsx# Ticket view, update fields, and close ticket action
│       │   ├── LoginPage.jsx     # User authentication form
│       │   ├── RegisterPage.jsx  # User registration form
│       │   └── HomePage.jsx      # Standalone landing page placeholder
│       ├── services\
│       │   ├── api.js            # Axios client, auth interceptor, 401 handler, error parser
│       │   ├── authService.js    # Auth API methods (login, register, getCurrentUser)
│       │   ├── ticketService.js  # Ticket API methods (create, list, get, update, close)
│       │   └── userService.js    # User API methods (getUsers)
└── server\                       # Node.js + Express + Mongoose Backend
    ├── .env                      # Server environment (PORT, MONGODB_URI, JWT_SECRET, etc.)
    ├── .env.example              # Template for server environment variables
    ├── package.json              # Server dependencies and scripts
    ├── src\
    │   ├── server.js             # Server bootstrap, env validation, DB connect, listen
    │   ├── app.js                # Express app setup, CORS, JSON body parser, route mounting
    │   ├── config\
    │   │   ├── database.js       # Mongoose connection with custom DNS resolution for Atlas
    │   │   ├── env.js            # Dotenv loader and required env validation
    │   │   └── jwt.js            # JWT signing and verification helpers
    │   ├── models\
    │   │   ├── User.js           # Mongoose model for users (name, email, passwordHash, role)
    │   │   └── Ticket.js         # Mongoose model for tickets (title, description, category, assignedTo, etc.)
    │   ├── middleware\
    │   │   ├── authenticate.js   # JWT Bearer verification middleware, sets req.user
    │   │   ├── errorHandler.js   # 404 handler and global error handler (catches E11000 duplicate)
    │   │   └── rateLimiter.js    # express-rate-limit middleware for auth endpoints
    │   ├── routes\
    │   │   ├── authRoutes.js     # /api/auth routes (register, login, me)
    │   │   ├── ticketRoutes.js   # /api/tickets routes (CRUD operations, close)
    │   │   ├── userRoutes.js     # /api/users routes (list users for assignment)
    │   │   └── healthRoutes.js   # /api/health route
    │   ├── controllers\
    │   │   ├── authController.js # Auth request handlers (register, login, getCurrentUser)
    │   │   ├── ticketController.js # Ticket handlers (create, list, get, update, close)
    │   │   ├── userController.js # User handlers (listUsers)
    │   │   └── healthController.js # Health status handler checking DB state
    │   └── validators\
    │       ├── authValidators.js # Zod schemas for registration and login
    │       └── ticketValidators.js # Zod schemas for tickets and query filters
    ├── scripts\
    │   ├── explainQuery.js   # Execution plan benchmark runner using explain("executionStats")
    │   └── seedTickets.js    # Repeatable 10,000 ticket dev-only seeding script
    └── tests\
        ├── auth.test.js          # Vitest integration tests for auth routes
        ├── health.test.js        # Vitest test for /api/health
        ├── rateLimit.test.js     # Vitest tests for rate limiting middleware
        ├── ticket.test.js        # Vitest integration tests for ticket ownership, assignment, and CRUD
        └── user.test.js          # Vitest tests for user listing endpoint
```

---

## 4. Backend Architecture & Implementation Details

### Configuration (`server/src/config/`)
- **`env.js`:**
  - Loads environment variables via `dotenv/config`.
  - Exposes `env` object: `jwtExpiresIn` (default `'1d'`), `jwtSecret`, `mongoUri`, `nodeEnv` (default `'development'`), `port` (default `5000`).
  - `validateEnvironment()` asserts presence of `JWT_SECRET` and `MONGODB_URI`. Server exits with error code 1 if missing.
- **`database.js`:**
  - Sets public DNS servers (`dns.setServers(["8.8.8.8", "1.1.1.1"])`) to reliably resolve MongoDB Atlas `mongodb+srv` SRV records in restricted DNS environments.
  - Connects to MongoDB via `mongoose.connect(env.mongoUri)`.
  - Provides `getDatabaseStatus()` mapping connection readyState (`disconnected`, `connected`, `connecting`, `disconnecting`).
- **`jwt.js`:**
  - `createAccessToken(userId)`: Signs token with payload `{ sub: userId.toString() }` and configured expiration.
  - `verifyAccessToken(token)`: Validates signature and decodes token.

### Data Models (`server/src/models/`)
- **`User.js`:**
  - `name`: `String`, required, trimmed.
  - `email`: `String`, required, unique, lowercase, trimmed.
  - `passwordHash`: `String`, required, `select: false` (omitted from query results by default).
  - `role`: `String`, enum: `['user', 'admin']`, default: `'user'`.
  - `timestamps: true`.
- **`Ticket.js`:**
  - `title`: `String`, required, trimmed, max length 160.
  - `description`: `String`, required, trimmed, max length 5000.
  - `category`: `String`, required, trimmed, max length 60.
  - `priority`: `String`, enum: `['low', 'medium', 'high']`, default: `'medium'`.
  - `status`: `String`, enum: `['open', 'in_progress', 'closed']`, default: `'open'`.
  - `createdBy`: `ObjectId` referencing `User`, required, immutable.
  - `assignedTo`: `ObjectId` referencing `User`, optional, default `null`.
  - `timestamps: true`.
  - Indexes: Justified compound indexes `{ createdBy: 1, createdAt: -1 }` and `{ assignedTo: 1, createdAt: -1 }` for ownership isolation, newest-first sorting, and pagination without in-memory sort.

### Validation Schemas (`server/src/validators/`)
- **`authValidators.js`:**
  - `registerSchema`: `name` (2-100 chars), `email` (valid email, normalized to lowercase), `password` (8-72 chars).
  - `loginSchema`: `email` (normalized), `password` (8-72 chars).
- **`ticketValidators.js`:**
  - Priorities: `['low', 'medium', 'high']`.
  - Statuses: `['open', 'in_progress', 'closed']`.
  - `assignedToField`: 24-hex ObjectId, empty string (transformed to null), or null.
  - `createTicketSchema`: strict object with `title`, `description`, `category`, optional `priority` (default `'medium'`), and optional `assignedTo`.
  - `updateTicketSchema`: partial strict object with at least one field required via `.refine()`.
  - `ticketParamsSchema`: validates `ticketId` as a 24-character hexadecimal MongoDB ObjectId.
  - `listTicketsSchema`: validates query params: optional `status`, optional `priority`, optional `scope` (`'all' | 'created' | 'assigned'`, default `'all'`), optional `q` (1-100 chars), `page` (integer, min 1, default 1), `limit` (integer, 1-50, default 10).

### Middleware (`server/src/middleware/`)
- **`authenticate.js`:**
  - Extracts `Authorization: Bearer <token>`. Returns 401 `UNAUTHORIZED` if missing or invalid format.
  - Verifies token using `verifyAccessToken`.
  - Fetches user via `User.findById(payload.sub).select('-passwordHash')`.
  - Attaches user document to `request.user`.
- **`errorHandler.js`:**
  - `notFound`: Catches unhandled routes, returns 404 with code `NOT_FOUND`.
  - `errorHandler`: Global Express error handler. Special-cases Mongo error code `11000` (duplicate key) to return 409 `EMAIL_ALREADY_EXISTS`. Other unhandled errors return 500 `INTERNAL_SERVER_ERROR`.
- **`rateLimiter.js`:**
  - Configurable rate limiting using `express-rate-limit` with `MemoryStore`.
  - Applied to `POST /api/auth/register` and `POST /api/auth/login`.
  - Configurable via `AUTH_RATE_LIMIT_WINDOW_MS` (default 15 minutes) and `AUTH_RATE_LIMIT_MAX` (default 10 requests).
  - Returns HTTP 429 with `{ error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests. Please try again later.' } }`.
  - Includes standard `RateLimit-*` draft-6 headers (`RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`).
  - *Note:* In-memory counters are local to the running Node.js process and not shared across horizontal server instances.

### API Routes & Controllers

| Method | Endpoint | Auth | Description | Controller Handler |
|---|---|---|---|---|
| `GET` | `/api/health` | No | Reports API and database status (returns 200 or 503) | `healthController.getHealth` |
| `POST` | `/api/auth/register` | No | Registers user, hashes password with bcrypt (12 rounds), returns serialized user & JWT | `authController.register` |
| `POST` | `/api/auth/login` | No | Authenticates credentials, returns serialized user & JWT | `authController.login` |
| `GET` | `/api/auth/me` | Yes | Returns current authenticated user (excluding passwordHash) | `authController.getCurrentUser` |
| `GET` | `/api/users` | Yes | Lists registered users (`id, name, email`) for ticket assignment | `userController.listUsers` |
| `POST` | `/api/tickets` | Yes | Creates new ticket owned by `request.user._id` (supports optional `assignedTo`) | `ticketController.createTicket` |
| `GET` | `/api/tickets` | Yes | Lists tickets with search, filters, `scope` (`all`, `created`, `assigned`), sorting (`createdAt: -1`), pagination | `ticketController.listTickets` |
| `GET` | `/api/tickets/:ticketId` | Yes | Fetches ticket accessible by creator or assignee | `ticketController.getTicket` |
| `PATCH` | `/api/tickets/:ticketId` | Yes | Updates ticket (Creator can edit all fields; Assignee can only update `status`) | `ticketController.updateTicket` |
| `PATCH` | `/api/tickets/:ticketId/close` | Yes | Sets status to `'closed'` (allowed for creator or assignee) | `ticketController.closeTicket` |
| `DELETE` | `/api/tickets/:ticketId` | Yes | Deletes ticket strictly owned by authenticated user (`createdBy`) | `ticketController.deleteTicket` |

#### Creator-Controlled Ticket Ownership & Assignment Implementation Detail
In `ticketController.js`:
- **Reading a ticket**: Accessible if user is creator (`createdBy`) or assignee (`assignedTo`).
- **Updating a ticket**:
  - If user is **creator**: Can update any field (`title`, `description`, `category`, `priority`, `status`, `assignedTo`).
  - If user is **assignee**: Can only update `status`. Attempting to update title, category, priority, description, or assignedTo returns HTTP 403 `FORBIDDEN`.
- **Closing a ticket**: Can be closed by creator or assignee via dedicated route.
- **Listing tickets**: Scoped by default to tickets where user is creator OR assignee (`$or: [{ createdBy }, { assignedTo }]`), with filter options for `scope=created` and `scope=assigned`.
- If a ticket belongs to someone else and user is not assigned, returns HTTP 404 `TICKET_NOT_FOUND`.

---

## 5. Frontend Architecture & Implementation Details

### Client State & Session Management (`client/src/App.jsx`)
- Session storage uses `localStorage` keys:
  - `'resolveToken'`: stores the JWT access token.
  - `'resolveUser'`: stores serialized user object (`{ id, name, email, role }`).
- `App.jsx` manages `user` state initialized with `getStoredUser()`.
- Listeners:
  - Subscribes to `window.addEventListener('resolve:unauthorized', logout)` to automatically wipe local storage and clear user state whenever any API request encounters an unexpected 401.

### API Client (`client/src/services/api.js`)
- Axios instance configured with `baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api'`.
- Request Interceptor: Automatically attaches `Authorization: Bearer <token>` from `localStorage`.
- Response Interceptor: Listens for 401 responses (excluding `/auth/login`) and dispatches the global `resolve:unauthorized` window event.
- Error parsing helper `getApiErrorMessage(error)`:
  - Extracts validation errors from backend responses (`error.response.data.error.details`), flattening Zod field errors into readable strings (e.g. `"title: Required"`).
  - Extracts standard backend error message or Axios error message.

### Routing & Navigation
- `/login`: `LoginPage`
- `/register`: `RegisterPage`
- Protected Routes (wrapped by `ProtectedRoute`, requiring active `user`):
  - Wrapped by `AppLayout`:
    - `/`: `DashboardPage` (Recent 5 tickets, quick stats)
    - `/tickets`: `TicketListPage` (Filterable, searchable, paginated table)
    - `/tickets/new`: `CreateTicketPage` (Form to open a new ticket)
    - `/tickets/:ticketId`: `TicketDetailsPage` (View details, update fields, close ticket)
- Fallback route: Redirects to `/` if logged in, otherwise `/login`.

### Plain-CSS UI System (`client/src/index.css`)
- Clean, semantic, neutral styling adhering to project rules (no utility classes or UI frameworks).
- Design tokens:
  - Background: `#f8fafc`
  - Font: `Arial, sans-serif`
  - Text color: `#1f2937`
  - Primary button: `#2563eb` with border `#1d4ed8`
  - Navigation header: Dark background `#1f2937` with flex layout
  - Forms: Vertical stack `.form-stack` with labels and inputs
  - Status badges: `.status-closed` (green `#d1fae5`), `.status-in_progress` (yellow `#fef3c7`), open (neutral `#e5e7eb`)
  - Mobile responsive: Media queries at `max-width: 700px` adjusting header, page heading, and search filter grid into vertical stacks.

---

## 6. Observed Test & Verification Evidence

As mandated by `AGENTS.md`, only observed test results are recorded:

### Backend Vitest Test Suite
Run via `npm test` inside `server/`:
```text
> server@1.0.0 test
> vitest run --pool=threads --passWithNoTests

 RUN  v5.0.3 D:/Resolve/server

 ✓ tests/rateLimit.test.js (2 tests)
 ✓ tests/health.test.js (1 test)
 ✓ tests/user.test.js (2 tests)
 ✓ tests/ticket.test.js (10 tests)
 ✓ tests/auth.test.js (5 tests)

 Test Files  5 passed (5)
      Tests  20 passed (20)
```

**Tested Behaviors:**
1. Registration hides `passwordHash` and ignores client-provided `role`.
2. Duplicate email registration returns 409 `EMAIL_ALREADY_EXISTS`.
3. Bad credentials on login return 401 `INVALID_CREDENTIALS`.
4. Missing or invalid token on protected route `/api/auth/me` returns 401 `UNAUTHORIZED`.
5. Created ticket is assigned `createdBy` matching authenticated user, with optional `assignedTo`.
6. Authenticated callers can list registered users (`GET /api/users`) for assignment.
7. Ticket listing applies user ownership/assignee filter, `scope` filter (`all`, `created`, `assigned`), status filter, priority filter, search keyword, pagination skip/limit, and descending timestamp sorting.
8. Owned tickets can be retrieved, updated, and closed via dedicated endpoint.
9. Assignees can view tickets assigned to them and update `status` or close the ticket.
10. Assignees are forbidden (HTTP 403) from editing non-status fields (e.g. title, category, priority, description, or reassigning).
11. Updating or viewing another user's unassigned ticket returns 404 (zero data leakage).
12. Invalid input rejected with 400 `VALIDATION_ERROR`.
13. Health check endpoint accurately reports database connection status without claiming API failure.
14. Rate limiting permits requests within the configured limit and includes standard `RateLimit-*` headers.
15. Rate limiting returns HTTP 429 with consistent JSON `{ error: { code: 'TOO_MANY_REQUESTS', message: '...' } }` when limit is exceeded.

---

## 7. Known Gaps, Upcoming Tasks & Backlog

When continuing work on this project, prioritize the following items:

1. **MongoDB Index Justification & Performance Benchmarks (`AGENTS.md` requirement):**
   - Justified compound indexes `{ createdBy: 1, createdAt: -1 }` and `{ assignedTo: 1, createdAt: -1 }` have been declared on `Ticket.js`.
   - Baseline measurements recorded in Section 6.
   - Pending: Re-run benchmark with `node scripts/explainQuery.js` after database sync to capture post-change metrics.
2. **Security Middleware Wiring:**
   - Rate limiting via `express-rate-limit` is implemented and active on `/api/auth/register` and `/api/auth/login`.
   - Remaining: Apply Helmet security headers.
3. **Ticket Deletion:**
   - `AGENTS.md` notes ownership enforcement for ticket read, update, and *delete* operations.
   - Ticket deletion endpoint (`DELETE /api/tickets/:ticketId`) is not yet implemented.
4. **Admin Role Capabilities:**
   - `User` schema supports `role: 'admin'`, but there is currently no role-based authorization middleware or admin management views.
5. **Frontend Testing:**
   - Vitest / React Testing Library tests for client components and page workflows are not yet configured.

---

## 8. Operational Commands

### Backend (`server/`)
- Dev server: `npm run dev` (runs `nodemon src/server.js`)
- Production start: `npm run start` (runs `node src/server.js`)
- Tests: `npm test` (runs `vitest run --pool=threads --passWithNoTests`)
- Seed 10k tickets: `npm run seed` (runs `node scripts/seedTickets.js`)
- Explain query benchmark: `node scripts/explainQuery.js`

### Frontend (`client/`)
- Dev server: `npm run dev` (starts Vite on `http://localhost:5173`)
- Build: `npm run build` (outputs to `dist/`)
- Linting: `npm run lint` (runs `eslint .`)
- Preview build: `npm run preview`

