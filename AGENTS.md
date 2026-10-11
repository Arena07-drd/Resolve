# Resolve Project Rules

## Stack and UI

- Build Resolve with MongoDB Atlas/Mongoose, Express/Node.js, and React/Vite.
- Use JavaScript with ES modules consistently.
- Use plain CSS only: no Tailwind, component libraries, animations, or elaborate charts.

## Structure and Naming

- Keep frontend code in `client/` and backend code in `server/`.
- Organize backend code by responsibility (for example: `models/`, `routes/`, `controllers/`, `middleware/`, `schemas/`, and `tests/`).
- Use clear camelCase names for JavaScript files, functions, and variables; use PascalCase for React components and Mongoose models.

## Safe, Incremental Work

- Inspect relevant existing files before editing them; do not overwrite working code without explaining why.
- Make small, verifiable changes. After each phase, report changed files, commands to run, expected output, manual checks, and known limitations.
- Ask before destructive operations, database deletion, or major architecture changes.

## Security and Data Access

- Hash passwords with bcryptjs; never store plaintext passwords.
- Authenticate with JWT and keep secrets only in environment variables.
- Never expose passwords, JWT secrets, connection strings, or other secrets in code, logs, responses, or documentation.
- Enforce ticket ownership in the backend for every ticket read, update, and delete operation.
- Validate request input with Zod.

## Testing and Performance Evidence

- Use Vitest and Supertest for backend tests, covering authentication, validation, and ticket ownership.
- Measure the ticket-list MongoDB query with `explain("executionStats")` before and after adding a justified index.
- Record only observed benchmark and test results; never invent results, completed features, or measurements.
