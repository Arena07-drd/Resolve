# Resolve — Support Ticket Management System

**Resolve** is a full-stack support-ticket management application built with the MERN stack (MongoDB Atlas, Express, React, and Node.js) for the **StartupMeu MERN Internship Submission**.

The project prioritizes backend authorization and data isolation, strict request validation with Zod, JWT authentication with `bcryptjs` password hashing, configurable rate limiting, evidence-based MongoDB indexing, and a clean, accessible plain-CSS user interface.

---

## Table of Contents

1. [Project Description](#1-project-description)
2. [Implemented Features](#2-implemented-features)
3. [Technology Stack](#3-technology-stack)
4. [Architecture and Folder Structure](#4-architecture-and-folder-structure)
5. [Prerequisites](#5-prerequisites)
6. [Installation Instructions](#6-installation-instructions)
7. [Environment Variables](#7-environment-variables)
8. [Running the Application](#8-running-the-application)
9. [Running Tests and Building the Frontend](#9-running-tests-and-building-the-frontend)
10. [Deployed URLs](#10-deployed-urls)
11. [MongoDB Query Optimization Experiment](#11-mongodb-query-optimization-experiment)
12. [AI / Codex-Assisted Development Workflow](#12-ai--codex-assisted-development-workflow)
13. [Known Limitations and Future Improvements](#13-known-limitations-and-future-improvements)

---

## 1. Project Description

Resolve enables authenticated users to create, track, assign, filter, update, close, and delete support tickets. Every ticket operation enforces strict ownership and permission rules on the server:

- **Ticket Creators (`createdBy`)** have full control over their tickets: they can view, edit all fields (`title`, `description`, `category`, `priority`, `status`, `assignedTo`), close, or delete the ticket.
- **Assigned Users (`assignedTo`)** can view tickets assigned to them and update the ticket `status` (including closing the ticket), but are forbidden (`HTTP 403`) from modifying non-status fields or deleting the ticket.
- **Unrelated Users** cannot view, modify, or delete tickets they neither created nor were assigned to. The API returns `HTTP 404` (`TICKET_NOT_FOUND`) rather than `403` for unauthorized ticket IDs to prevent resource enumeration.

---

## 2. Implemented Features

Only features that are implemented and verified in the repository are listed below:

### Authentication & Security
- **User Registration (`POST /api/auth/register`)**: Validates `name`, normalized `email`, and `password` (8–72 characters) with Zod; hashes passwords using `bcryptjs` (12 salt rounds); prevents mass assignment (client-supplied `role` fields are ignored, defaulting to `'user'`); never returns `passwordHash`.
- **User Login (`POST /api/auth/login`)**: Authenticates credentials with constant-time mitigation against timing-based user enumeration (executes `bcrypt.compare` against a precomputed dummy hash when an email is not found).
- **Session Verification (`GET /api/auth/me`)**: Validates `Authorization: Bearer <token>` JWT headers and returns the current user profile.
- **Authentication Rate Limiting**: Uses `express-rate-limit` on `/api/auth/register` and `/api/auth/login` with configurable window and request limits, returning `HTTP 429` (`TOO_MANY_REQUESTS`) and standard `RateLimit-*` headers (`draft-6`).
- **HTTP Security Headers**: Uses `helmet` middleware across all API routes.

### Ticket Management & Ownership
- **Create Ticket (`POST /api/tickets`)**: Creates a ticket tied to the authenticated user (`createdBy`) with optional user assignment (`assignedTo`). Verifies in MongoDB that any specified assignee user ID exists before saving.
- **List Tickets (`GET /api/tickets`)**:
  - Enforces user scoping (`scope=all` for created or assigned, `scope=created`, `scope=assigned`).
  - Supports optional equality filters for `status` (`open`, `in_progress`, `closed`) and `priority` (`low`, `medium`, `high`).
  - Supports case-insensitive keyword search (`q`) across `title`, `description`, and `category` with regex special-character escaping.
  - Sorts results newest-first (`createdAt: -1`).
  - Implements `page` and `limit` pagination alongside total document counts (`total`, `totalPages`).
- **Get Ticket Details (`GET /api/tickets/:ticketId`)**: Returns a single ticket if the requester is the creator or assignee.
- **Update Ticket (`PATCH /api/tickets/:ticketId`)**: Creators can update any ticket field; assignees can only update `status`. Rejects empty update payloads and unknown fields via strict Zod schemas.
- **Close Ticket (`PATCH /api/tickets/:ticketId/close`)**: Dedicated endpoint allowing the creator or assignee to transition a ticket to `closed`.
- **Delete Ticket (`DELETE /api/tickets/:ticketId`)**: Allows only the ticket creator (`createdBy`) to permanently delete a ticket (`HTTP 204`). Assignees receive `HTTP 403 FORBIDDEN`.
- **User Directory for Assignment (`GET /api/users`)**: Returns `{ id, name, email }` of registered users so authenticated users can assign tickets via a dropdown.
- **Health Check (`GET /api/health`)**: Reports API status and current Mongoose connection state (`connected`, `disconnected`, `connecting`, `disconnecting`).

### Frontend Interface (React + Vite + Plain CSS)
- **Authentication Pages**: Login (`/login`) and Registration (`/register`) forms with error handling.
- **Dashboard (`/`)**: Displays total ticket count and the 5 most recent tickets with quick navigation.
- **Ticket List (`/tickets`)**: Interactive search bar, status filter, priority filter, view scope filter (`All my tickets`, `Created by me`, `Assigned to me`), data table with status/priority badges, and pagination controls.
- **Create Ticket (`/tickets/new`)**: Form for creating a ticket and optionally assigning it to a registered user.
- **Ticket Details (`/tickets/:ticketId`)**: Displays ticket metadata, adapts form controls based on whether the logged-in user is the creator or assignee, and provides actions to save changes or close the ticket.
- **Automatic Session Expiry Handling**: Axios response interceptor catches `HTTP 401` responses on protected requests, clears `localStorage`, and redirects to `/login`.

---

## 3. Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Runtime** | Node.js (ES Modules) | v20+ / v24 | JavaScript runtime environment |
| **Backend Framework** | Express | `^5.3.0` | REST API routing and middleware |
| **Database & ODM** | MongoDB Atlas & Mongoose | `^9.11.1` | Document persistence and schema modeling |
| **Validation** | Zod | `^4.6.5` | Strict request body, query, and parameter validation |
| **Authentication** | `jsonwebtoken` & `bcryptjs` | `^9.0.3` / `^3.0.3` | Stateless JWT auth and password hashing |
| **Security Middleware** | `helmet`, `express-rate-limit`, `cors` | `^8.3.0` / `^8.7.1` / `^2.8.6` | Security headers, brute-force protection, CORS |
| **Frontend Library** | React & React DOM | `^19.2.8` | Component-based UI |
| **Build Tool** | Vite | `^8.3.0` | Frontend dev server and bundler |
| **Routing & HTTP** | React Router (`react-router-dom`) & Axios | `^7.18.4` / `^1.20.0` | Client-side routing and centralized API client |
| **Styling** | Plain CSS (`client/src/index.css`) | CSS3 | Responsive layout without external CSS frameworks |
| **Testing** | Vitest & Supertest | `^5.0.3` / `^7.3.1` | Backend integration and route testing |

---

## 4. Architecture and Folder Structure

The repository is organized into two standalone packages: `client/` (React frontend) and `server/` (Express backend).

```text
Resolve/
├── AGENTS.md                         # Project engineering rules and constraints
├── README.md                         # Project documentation
├── context.md                        # Detailed internal architectural context
├── client/                           # React + Vite frontend application
│   ├── .env.example                  # Frontend environment variable template
│   ├── index.html                    # HTML entry point
│   ├── package.json                  # Frontend dependencies and scripts
│   ├── vite.config.js                # Vite configuration
│   └── src/
│       ├── main.jsx                  # Application bootstrap and BrowserRouter
│       ├── App.jsx                   # Routes, auth state, and 401 event listener
│       ├── index.css                 # Plain CSS stylesheet for all components
│       ├── components/
│       │   ├── AppLayout.jsx         # Top navigation bar and layout wrapper
│       │   ├── ProtectedRoute.jsx    # Route guard for authenticated pages
│       │   ├── ErrorMessage.jsx      # Error alert banner
│       │   ├── LoadingMessage.jsx    # Loading state indicator
│       │   ├── TicketForm.jsx        # Reusable form for ticket creation/editing
│       │   └── TicketTable.jsx       # Reusable table for displaying tickets
│       ├── pages/
│       │   ├── LoginPage.jsx         # Login view
│       │   ├── RegisterPage.jsx      # Registration view
│       │   ├── DashboardPage.jsx     # Recent tickets overview
│       │   ├── TicketListPage.jsx    # Searchable, filterable, paginated ticket list
│       │   ├── CreateTicketPage.jsx  # New ticket creation view
│       │   └── TicketDetailsPage.jsx # Single ticket view, edit, and close actions
│       └── services/
│           ├── api.js                # Axios instance, JWT interceptor, error parser
│           ├── authService.js        # Login, register, current user API calls
│           ├── ticketService.js      # Ticket CRUD and close API calls
│           └── userService.js        # User list API call for ticket assignment
└── server/                           # Express + Mongoose backend API
    ├── .env.example                  # Backend environment variable template
    ├── package.json                  # Backend dependencies and scripts
    ├── src/
    │   ├── server.js                 # Entry point: validates env, connects DB, starts server
    │   ├── app.js                    # Express app configuration and middleware pipeline
    │   ├── config/
    │   │   ├── database.js           # Mongoose connection helper and status reporter
    │   │   ├── env.js                # Environment variable loader and validator
    │   │   └── jwt.js                # JWT sign and verify utilities
    │   ├── controllers/
    │   │   ├── authController.js     # Register, login, and current user handlers
    │   │   ├── ticketController.js   # Ticket CRUD, filtering, ownership, and close logic
    │   │   ├── userController.js     # User listing handler for assignment dropdowns
    │   │   └── healthController.js   # Health check endpoint handler
    │   ├── middleware/
    │   │   ├── authenticate.js       # Bearer token verification middleware
    │   │   ├── errorHandler.js       # 404 and centralized error handling middleware
    │   │   └── rateLimiter.js        # Configurable express-rate-limit middleware
    │   ├── models/
    │   │   ├── User.js               # User Mongoose schema and model
    │   │   └── Ticket.js             # Ticket Mongoose schema, model, and compound indexes
    │   ├── routes/
    │   │   ├── authRoutes.js         # /api/auth routes
    │   │   ├── ticketRoutes.js       # /api/tickets routes
    │   │   ├── userRoutes.js         # /api/users routes
    │   │   └── healthRoutes.js       # /api/health route
    │   └── validators/
    │       ├── authValidators.js     # Zod schemas for auth payloads
    │       └── ticketValidators.js   # Zod schemas for ticket payloads and query params
    ├── scripts/
    │   ├── seedTickets.js            # Development-only script to seed 10,000 tickets
    │   └── explainQuery.js           # Script to run explain("executionStats") on ticket queries
    └── tests/
        ├── auth.test.js              # Authentication & timing-safety integration tests
        ├── health.test.js            # Health check & Helmet security header tests
        ├── rateLimit.test.js         # Rate limiting behavior tests
        ├── ticket.test.js            # Ticket ownership, validation, assignment, and CRUD tests
        └── user.test.js              # User listing endpoint tests
```

---

## 5. Prerequisites

- **Node.js**: Version `20.x` or later (tested on Node.js `v24.13.0`).
- **npm**: Version `10.x` or later.
- **MongoDB**: A MongoDB Atlas cluster connection string (`mongodb+srv://...`) or a local MongoDB instance.

---

## 6. Installation Instructions

1. **Clone the repository**:
   ```bash
   git clone <YOUR_GITHUB_REPOSITORY_URL>
   cd Resolve
   ```

2. **Install backend dependencies**:
   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies**:
   ```bash
   cd ../client
   npm install
   ```

---

## 7. Environment Variables

Never commit real `.env` files or secrets to version control. Copy the provided `.env.example` files in both `server/` and `client/`.

### Backend (`server/.env`)

Create `server/.env` based on `server/.env.example`:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/resolve?retryWrites=true&w=majority
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1d
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=10
```

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | No | `development` | Environment mode (`development`, `test`, `production`) |
| `PORT` | No | `5000` | Port on which the Express server listens |
| `MONGODB_URI` | **Yes** | — | MongoDB Atlas or local connection URI |
| `JWT_SECRET` | **Yes** | — | Secret key used to sign and verify JWT access tokens |
| `JWT_EXPIRES_IN` | No | `1d` | JWT expiration duration |
| `AUTH_RATE_LIMIT_WINDOW_MS` | No | `900000` (15m) | Time window in milliseconds for auth rate limiting |
| `AUTH_RATE_LIMIT_MAX` | No | `10` | Max requests per IP within the rate-limit window |

### Frontend (`client/.env`)

Create `client/.env` based on `client/.env.example`:

```env
VITE_API_URL=http://localhost:5000/api
```

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | No | `http://localhost:5000/api` | Base URL of the Resolve backend API |

---

## 8. Running the Application

### Start the Backend Server

From the repository root:

```bash
# Development mode (with nodemon auto-reload)
npm run dev --prefix server

# Production mode
npm start --prefix server
```
The API will start on `http://localhost:5000` (or your configured `PORT`). You can verify it is running by visiting `http://localhost:5000/api/health`.

### Start the Frontend Development Server

In a separate terminal, from the repository root:

```bash
npm run dev --prefix client
```
The React application will be available at `http://localhost:5173`.

---

## 9. Running Tests and Building the Frontend

### Backend Automated Tests (Vitest & Supertest)

Run the backend test suite from the repository root:

```bash
npm test --prefix server
```

#### Actual Observed Test Output:
```text
> server@1.0.0 test
> vitest run --pool=threads --passWithNoTests

 RUN  v5.0.3 D:/Resolve/server

 ✓ tests/rateLimit.test.js (2 tests) 56ms
 ✓ tests/health.test.js (2 tests) 32ms
 ✓ tests/user.test.js (2 tests) 41ms
 ✓ tests/ticket.test.js (13 tests) 118ms
 ✓ tests/auth.test.js (6 tests) 812ms

 Test Files  5 passed (5)
      Tests  25 passed (25)
   Duration  1.86s
```

### Frontend Linter & Production Build

Run ESLint and build the production bundle from the repository root:

```bash
npm run lint --prefix client
npm run build --prefix client
```

#### Actual Observed Build Output:
```text
> client@0.0.0 lint
> eslint .

> client@0.0.0 build
> vite build

vite v8.3.4 building client environment for production...
transforming...
✓ 95 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   0.45 kB │ gzip:   0.29 kB
dist/assets/index-Bo0XVclj.css    2.05 kB │ gzip:   0.84 kB
dist/assets/index-W-L_QqH3.js   324.20 kB │ gzip: 104.30 kB

✓ built in 155ms
```

---

## 10. Deployed URLs

> **Note**: Fill in the placeholders below once deployed to your hosting provider (e.g., Render, Railway, Vercel, or Netlify).

- **Deployed Frontend URL**: `[PLACEHOLDER: Insert Deployed Frontend URL, e.g., https://resolve-client.vercel.app]`
- **Deployed Backend API URL**: `[PLACEHOLDER: Insert Deployed Backend Health URL, e.g., https://resolve-api.onrender.com/api/health]`

---

## 11. MongoDB Query Optimization Experiment

### 1. Target Query Pattern (`GET /api/tickets`)
Every ticket list request in [`server/src/controllers/ticketController.js`](server/src/controllers/ticketController.js) executes the following query structure:
- **Ownership / Scope Filter (Mandatory)**:
  - `scope === 'created'`: `{ createdBy: request.user._id }`
  - `scope === 'assigned'`: `{ assignedTo: request.user._id }`
  - `scope === 'all'` (default): `{ $or: [{ createdBy: request.user._id }, { assignedTo: request.user._id }] }`
- **Optional Equality Filters**: `status` (`open`, `in_progress`, `closed`) and `priority` (`low`, `medium`, `high`).
- **Sorting**: `.sort({ createdAt: -1 })` (newest tickets first).
- **Pagination**: `.skip((page - 1) * limit).limit(limit)`.

### 2. Index Design Rationale (ESR Rule)
Following MongoDB's **ESR (Equality, Sort, Range)** guideline, we added two narrow compound indexes in [`server/src/models/Ticket.js`](server/src/models/Ticket.js):

```javascript
ticketSchema.index({ createdBy: 1, createdAt: -1 })
ticketSchema.index({ assignedTo: 1, createdAt: -1 })
```

- **Why two compound indexes?** The default `scope=all` filter uses an `$or` clause across `createdBy` and `assignedTo`. For MongoDB to evaluate an `$or` query without a full collection scan (`COLLSCAN`), every branch of the `$or` must be supported by an index.
- **Why `(owner, createdAt: -1)` order?** The ownership field (`createdBy` or `assignedTo`) is a mandatory equality filter on 100% of queries, whereas `status` and `priority` are optional. Placing `createdAt: -1` immediately after the owner field allows MongoDB to read index keys in descending timestamp order, eliminating the in-memory `SORT` stage (32 MB limit).
- **Keyword Search (`q`) Trade-off**: Case-insensitive substring regex queries (`/$regex/i`) cannot efficiently use B-tree indexes. However, because the query uses `$and` to combine ownership with keyword search, MongoDB still uses the ownership index first to narrow down candidate documents to only those belonging to the user before evaluating the regex in memory.

### 3. Benchmark Reproduction Commands
1. **Seed 10,000 representative development tickets** (restricted to `NODE_ENV !== 'production'`):
   ```bash
   npm run seed --prefix server
   ```
2. **Run the `.explain("executionStats")` benchmark script**:
   ```bash
   node server/scripts/explainQuery.js
   ```

### 4. Recorded Measurements vs. Placeholders

#### A. Initial Observed Baseline (Pre-Seed 3-Document Collection, Before Index)
Measured directly via `node server/scripts/explainQuery.js` prior to adding compound indexes:
- **Winning Execution Plan**: `SORT` (`sortPattern: { createdAt: -1 }`) $\rightarrow$ `inputStage: COLLSCAN`
- **`totalDocsExamined`**: `3` (100% of collection scanned)
- **`totalKeysExamined`**: `0` (no index used)
- **`nReturned`**: `0`
- **`executionTimeMillis`**: `0` ms

#### B. 10,000-Ticket Benchmark Comparison Table
> **Action Required**: Run `npm run seed --prefix server` and `node server/scripts/explainQuery.js` against your development database before and after index creation, then replace the `[PLACEHOLDER]` values below with your observed numbers.

| Metric | Baseline (10k Docs, No Custom Index) | Post-Index (10k Docs, With Compound Indexes) | Expected Behavior Difference |
| :--- | :--- | :--- | :--- |
| **Winning Plan** | `[PLACEHOLDER: e.g., SORT -> COLLSCAN]` | `[PLACEHOLDER: e.g., LIMIT -> FETCH -> IXSCAN]` | Transitions from full `COLLSCAN` + in-memory `SORT` to indexed `IXSCAN` |
| **`totalDocsExamined`** | `[PLACEHOLDER: e.g., 10000]` | `[PLACEHOLDER: e.g., ~50 - 400]` | Examines only the user's matching documents instead of all 10,000 documents |
| **`totalKeysExamined`** | `[PLACEHOLDER: e.g., 0]` | `[PLACEHOLDER: e.g., ~50 - 400]` | Non-zero key examination proves B-tree index traversal |
| **`nReturned`** | `[PLACEHOLDER: e.g., 10]` | `[PLACEHOLDER: e.g., 10]` | Identical result set (`limit(10)`) |
| **`executionTimeMillis`** | `[PLACEHOLDER: e.g., XX ms]` | `[PLACEHOLDER: e.g., X ms]` | Reduced query latency and zero in-memory sort overhead |

---

## 12. AI / Codex-Assisted Development Workflow

This project was developed iteratively using an AI-assisted pair-programming workflow governed by the strict engineering rules in [`AGENTS.md`](AGENTS.md):

1. **Contract-First Inspection**:
   - Before generating or modifying frontend or backend code, existing Mongoose models, Zod validators, middleware, and route contracts were inspected so that changes remained minimal and backward-compatible.
2. **Incremental Implementation & Review**:
   - Features were built in small, isolated phases: (1) plain-CSS React interface wired to existing endpoints, (2) creator-controlled ticket assignment (`assignedTo` and `GET /api/users`), (3) query explain analysis and 10,000-ticket repeatable seed script, (4) compound index creation, and (5) authentication rate limiting.
3. **Structured Security & Code Audit**:
   - A full codebase review was conducted across 10 security and reliability categories. Every AI-identified issue was manually reviewed for root cause and verified with reproduction steps and automated tests:
     - **Timing Attack Mitigation**: Fixed early return in `login()` when an email does not exist by comparing against a precomputed `dummyPasswordHash`.
     - **Security Headers**: Mounted `helmet()` middleware in `app.js` and added header assertions in `health.test.js`.
     - **Assignee Referential Integrity**: Added `User.findById()` verification in `createTicket` and `updateTicket` so tickets cannot be assigned to non-existent user IDs (`400 INVALID_ASSIGNEE`).
     - **Ticket Deletion Ownership**: Implemented `DELETE /api/tickets/:ticketId` enforcing strict creator-only deletion (`204 No Content` for creator, `403 FORBIDDEN` for assignee).
     - **Frontend 401 Interceptor**: Refined Axios 401 handling so `/auth/register` errors are displayed inline rather than triggering a global redirect.
4. **Evidence-Based Verification**:
   - No feature or fix was accepted without executing `npm test --prefix server`, `npm run lint --prefix client`, and `npm run build --prefix client` and inspecting the real terminal output.

---

## 13. Known Limitations and Future Improvements

1. **In-Memory Rate Limiting (`MemoryStore`)**:
   - `express-rate-limit` currently tracks request counts in the Node.js process memory. If the backend is horizontally scaled across multiple server instances behind a load balancer, counters will not be shared across instances. Future improvement: back the rate limiter with Redis (`rate-limit-redis`).
2. **Keyword Search Scalability**:
   - The `q` search parameter uses case-insensitive regular expressions (`$regex`) across `title`, `description`, and `category`. While scoped to the authenticated user's tickets via the compound indexes, regex evaluation still scans all tickets belonging to that user. Future improvement: implement a MongoDB `$text` index or MongoDB Atlas Search for large per-user ticket volumes.
3. **Role-Based Admin Portal**:
   - The `User` model includes `role: ['user', 'admin']`, but administrative endpoints (such as viewing all organization tickets or managing users) are not yet implemented.
4. **Delete Button in Frontend UI**:
   - `DELETE /api/tickets/:ticketId` and `ticketService.deleteTicket()` are implemented and tested on the backend and frontend service layer, and can be wired to a confirmation button on `TicketDetailsPage.jsx`.
5. **Frontend Automated Testing**:
   - Backend endpoints have 25 automated Vitest + Supertest tests, whereas frontend verification currently relies on ESLint, Vite production builds, and manual browser testing. Future improvement: add Vitest + React Testing Library component tests.

