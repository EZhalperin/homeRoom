# HomeRoom Refactor & Audit Report

## 1. Per-Item Summary (Items 1 - 5)

### Item 1: Users Have an Email Everywhere (Highest Priority)
- **What was wrong**: Originally, user email was absent from schemas, models, and UI. The Supabase `users` table added a `NOT NULL UNIQUE email` column, but client UI (`Users.jsx`, `Profile.jsx`, `AuthContext.jsx`) had not been updated. On the server, repository and services returned email, but the client was not consuming it, displaying it, or allowing it to be created/edited.
- **What was changed**:
  - `client/src/context/AuthContext.jsx`: Preserved `email` from login response in the user state (`{ id, userId, email, role, firstName, lastName }`).
  - `client/src/pages/admin/Users.jsx`: Added `email` to `UserForm` state and form submit payload (both create and edit); added `<Input label="אימייל" type="email" ... />`; added table column header `<th>אימייל</th>` and table cell `<td data-label="אימייל">{u.email}</td>`.
  - `client/src/pages/shared/Profile.jsx`: Added `email` to profile state and patch mutation; added `<Input label="אימייל" type="email" ... />`; updated `AuthContext` with new email on successful mutation.
  - *Server (previous run & verified)*: `server/sql/schema.sql` adds `email varchar not null unique` and `users_email_lower_idx`; `userRepository.js` includes `email` in `PUBLIC_COLUMNS` and maps Postgres code 23505 duplicate email to `AppError("Email already in use", 409)`; `authService.js` includes email in `toPublicUser` and `login`; `userService.js` and `users.controller.js` support email in register, list, and update; `validators/common.js` defines `emailSchema` (trim + lowercase + `z.email()`); `env.js`, `.env.example`, and `seedAdmin.js` include `SEED_ADMIN_EMAIL`.
- **Files touched (this run)**:
  - `client/src/context/AuthContext.jsx`
  - `client/src/pages/admin/Users.jsx`
  - `client/src/pages/shared/Profile.jsx`

### Item 2: User `id` is Now a UUID
- **What was wrong**: Legacy assumptions of numeric user IDs (`parseInt`, `Number()`, `z.coerce.number()`).
- **What was changed**: Audited and verified across the entire stack that user `id` is treated strictly as a UUID string.
  - Schema defines `id uuid primary key default gen_random_uuid()`.
  - Server validation uses `z.uuid()` (`userUuid` in `validators/common.js`) for `:id` parameter validation.
  - JWT payload encodes `id: String(user.id)`.
  - Grep audit confirmed zero occurrences of `parseInt`, `Number()`, or `coerce.number` applied to user IDs across both server and client.
  - Client components treat `id` as string key/identifier.
- **Files touched**: Audited and confirmed in `server/src/validators/common.js`, `server/src/validators/admin.users.validator.js`, `server/src/services/authService.js`, `server/src/repositories/userRepository.js`, `server/tests/validators.users.test.js`, and client components.

### Item 3: Booleans Arriving as Strings (`isActive` and others)
- **What was wrong**: Query string parameters arrive as strings (`"true"`, `"false"`). Using `z.coerce.boolean()` turns `"false"` into `true`. In Express 5, `req.query` is a getter, preventing reliable in-place mutation.
- **What was changed**:
  - Used Zod 4 `z.stringbool()` (`queryBoolean` in `validators/common.js`) for all boolean query parameters (`admin.users.validator.js`, `classes.validator.js`).
  - Request bodies strictly require native booleans (`z.boolean()`).
  - Dates normalized at the validator boundary with `z.coerce.date()` (`forms.validator.js`, `grades.validator.js`, `attendance.validator.js`).
  - `middleware/validate.js` stores typed, parsed results on `req.validated`. All controllers read query, body, and params from `req.validated`.
- **Files touched**: Audited and confirmed in `server/src/validators/common.js`, `server/src/validators/admin.users.validator.js`, `server/src/validators/classes.validator.js`, `server/src/middleware/validate.js`, `server/src/controllers/*.js`, and `server/tests/validate.middleware.test.js`.

### Item 4: MongoDB Connection & Async/Await Deep Audit
- **What was wrong**: Race conditions on concurrent connect, non-memoized promises, potential module-load collection accesses, unhandled shutdown errors.
- **What was changed**:
  - `config/mongo.js`: `connectMongo()` memoizes the connection promise (`connecting`), sharing it across concurrent calls. On connection error, client and db state are reset to allow a clean retry. `closeMongo()` is idempotent.
  - `getDb()` and `getCollection()` are synchronous accessors that throw descriptive errors if called before connection.
  - Repository collection handles are lazy: `const col = () => getCollection(COLLECTION)` called inside functions, never at module import time.
  - Server bootstrap in `server.js`: Validates env -> `await connectMongo()` -> `await ensureIndexes()` -> `app.listen()`. Graceful shutdown handles `SIGINT` and `SIGTERM` idempotently.
  - Driver calls across all repositories (`classRepository.js`, `studentRepository.js`, `attendanceRepository.js`, `formRepository.js`, `gradeRepository.js`) are properly awaited, without leaking cursors.
  - Error mapping in repository layer: MongoDB code 11000 duplicate keys mapped to 409 `AppError`, invalid ObjectIds mapped to 400 `AppError`.
- **Files touched**: Audited and confirmed in `server/src/config/mongo.js`, `server/src/server.js`, `server/src/repositories/*.js`, and `server/tests/mongo.connection.test.js`.

### Item 5: Full Audit, Find and Fix Other Problems
- **What was wrong**:
  1. `npm test` failed because 3 empty 0-byte placeholder test files existed in `server/tests/`.
  2. 3 empty 0-byte placeholder files existed in `client/src/api/`.
  3. Node version mismatch in execution environment: default system Node 18 lacked Node 22+ native WebSocket (needed by Supabase client) and `styleText` (needed by Vite bundler), resolved by using installed Node 26.
  4. Contract verification across parent/child endpoints and form updating.
- **What was changed**:
  1. Deleted dead 0-byte placeholder files in `server/tests/` and `client/src/api/`.
  2. Verified that `GET /api/parents/my-child` returns student `id` (`studentService.js`).
  3. Verified `newDeadline` parameter handling in teacher forms modal (`client/src/pages/teacher/Forms.jsx`) aligns with `forms.validator.js` and `forms.controller.js`.
  4. Verified CSS RTL logical properties throughout `client/src` (no physical `left`/`right`).
  5. Verified security posture: brute-force rate limiter on `POST /api/auth/login`, `helmet()`, CORS origin restriction, JSON body limit (100kb), HS256 algorithm pinning in `verifyToken`, and 401/403 token clearance in Axios interceptor.
- **Files touched**:
  - `server/tests/gradeService.test.js` (deleted)
  - `server/tests/ownership.test.js` (deleted)
  - `server/tests/riskIndexService.test.js` (deleted)
  - `client/src/api/analytics.js` (deleted)
  - `client/src/api/announcements.js` (deleted)
  - `client/src/api/messages.js` (deleted)
  - `docs/PROGRESS.md` (created & updated)
  - `docs/CHANGES_REPORT.md` (created)

---

## 2. Table of All Modified / Created / Deleted Files (This Session)

| File | Action | Reason |
| :--- | :---: | :--- |
| `client/src/context/AuthContext.jsx` | Modified | Added `email` to user object stored in `AuthContext` on login. |
| `client/src/pages/admin/Users.jsx` | Modified | Added `email` field to `UserForm` (creation & edit) and `אימייל` column to users table. |
| `client/src/pages/shared/Profile.jsx` | Modified | Added `email` display and edit input, updating AuthContext on change. |
| `client/src/api/analytics.js` | Deleted | 0-byte dead placeholder file; verified no imports exist. |
| `client/src/api/announcements.js` | Deleted | 0-byte dead placeholder file; verified no imports exist. |
| `client/src/api/messages.js` | Deleted | 0-byte dead placeholder file; verified no imports exist. |
| `server/tests/gradeService.test.js` | Deleted | 0-byte dead placeholder test file causing Jest to fail ("suite must contain at least one test"). |
| `server/tests/ownership.test.js` | Deleted | 0-byte dead placeholder test file causing Jest to fail ("suite must contain at least one test"). |
| `server/tests/riskIndexService.test.js` | Deleted | 0-byte dead placeholder test file causing Jest to fail ("suite must contain at least one test"). |
| `docs/PROGRESS.md` | Created | Audit status tracking document per Step 0 requirements. |
| `docs/CHANGES_REPORT.md` | Created | Full refactor audit and changes report. |

---

## 3. Deletions of Dead / Unnecessary Code and Rationale

1. **`client/src/api/analytics.js`, `announcements.js`, `messages.js`**:
   - *Rationale*: All were empty (0-byte) placeholder files from scaffold. Verified with grep that nothing in the codebase imported or referenced them.
2. **`server/tests/gradeService.test.js`, `ownership.test.js`, `riskIndexService.test.js`**:
   - *Rationale*: All were 0-byte scaffold files from initial commit (`24ef78a`), containing zero tests and causing Jest to fail suite execution. Tests covering all modified refactor logic (`mongo.connection.test.js`, `userRepository.errors.test.js`, `validators.users.test.js`, `validate.middleware.test.js`) are fully passing.

---

## 4. Extra Problems Found in the Audit: Fixed vs. Found-But-Not-Fixed

### Fixed
- **Missing email integration in React client**: Fixed across AuthContext, Admin Users management, and User Profile pages.
- **Jest suite failures from empty test files**: Fixed by removing 0-byte test files.
- **Dead placeholder files in client api**: Removed.
- **Express 5 query typing**: Addressed by relying on `req.validated.query`.

### Found-But-Not-Fixed (with reasons)
- **Large client bundle warning (`> 500 kB`) during build**: Vite/Rolldown reports that the client bundle chunk is ~742 kB (uncompressed) / 223 kB (gzipped). This is due to React, React DOM, TanStack Query, and Recharts in a single chunk. It is not an error and does not affect correctness, but dynamic code splitting (`React.lazy()`) could be introduced in a future performance optimization pass.
- **Node runtime requirement**: Node.js 22+ (e.g. Node 26) is required for native WebSocket in Supabase JS client and `node:util` `styleText` in Vite/Rolldown. On systems running Node 18, NVM or upgrading Node is necessary.

---

## 5. Manual Steps for Deployment / Setup

### A. SQL Migration Statements (Run in Supabase SQL Editor)
If not already executed on your remote Supabase Postgres instance, execute the following:

```sql
-- 1. Ensure pgcrypto is enabled for uuid generation
create extension if not exists pgcrypto;

-- 2. Add email column to users table (if table already exists without it)
alter table public.users
  add column if not exists email varchar;

-- Populate existing rows with placeholder emails if necessary before enforcing NOT NULL:
-- update public.users set email = "userId" || '@school.local' where email is null;

alter table public.users
  alter column email set not null;

-- 3. Add unique constraint and lowercase index on email
alter table public.users
  add constraint users_email_key unique (email);

create unique index if not exists users_email_lower_idx
  on public.users (lower(email));

-- 4. Change id column from numeric/serial to uuid
-- Note: If you already changed id to uuid outside code, skip this step.
-- If migrating from serial to uuid:
alter table public.users
  alter column id set default gen_random_uuid();
```

### B. Dependencies (npm install / uninstall commands)
Dependencies are already installed in `node_modules`. If installing from scratch in a fresh environment:

```bash
# Server dependencies:
cd server
npm install

# Client dependencies:
cd ../client
npm install
```

*(Note: The CLI package `supabase` was confirmed absent from `server/package.json`; only `@supabase/supabase-js` is used.)*

### C. New Environment Variables
The following environment variable was introduced in `server/src/config/env.js` and `.env.example`:

- `SEED_ADMIN_EMAIL`: Required when running `npm run seed:admin`. Example:
  ```env
  SEED_ADMIN_EMAIL=admin@school.local
  ```

---

## 6. Budget Status
All items (Item 1 through Item 5) have been completely audited and finished. There are no remaining uncompleted items.

---

## 7. Suggested Edits to `.cursorrules`

The following updates to `.cursorrules` are recommended to reflect the updated schema and standards:
1. **User Entity fields**: Update the SQL User entity documentation to include `email`:
   - Change:
     `The User entity in Supabase includes: id (UUID, Primary Key), userId (ID number, unique), password (Bcrypt), role (Enum: 'admin', 'teacher', 'parent'), firstName, lastName, isActive (Boolean).`
   - To:
     `The User entity in Supabase includes: id (UUID, Primary Key), userId (ID number, unique), email (String, unique, lowercase), password (Bcrypt), role (Enum: 'admin', 'teacher', 'parent'), firstName, lastName, isActive (Boolean).`
2. **Validation Convention**: Document that in Express 5, all controllers must read parsed/typed data from `req.validated` (`req.validated.body`, `req.validated.query`, `req.validated.params`) to guarantee type correctness, especially for boolean query params (`z.stringbool()`) and date coercion.
