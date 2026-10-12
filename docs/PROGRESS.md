# HomeRoom Refactor Progress Audit

Audit conducted on the partially completed refactor and final completed status.

## Verification
- **Server tests (`npm test`)**: 4 test suites passed, 15 tests passed (`mongo.connection.test.js`, `userRepository.errors.test.js`, `validate.middleware.test.js`, `validators.users.test.js`). 0 failures.
- **Client build (`npm run build`)**: Passes cleanly (`tsc -b && vite build`).
- **Client lint (`npm run lint`)**: Passes cleanly (`eslint .`).

## Status by Item

| Item | Status | Evidence & Completed Actions |
| :--- | :---: | :--- |
| **Item 1: users have an email, everywhere** | **DONE** | **Server:** `schema.sql` has `email varchar not null unique` and lowercase index. `userRepository.js` includes `email` in `PUBLIC_COLUMNS` and maps Postgres 23505 conflict to 409 "Email already in use". `authService.js` includes `email` in `toPublicUser` and `login`. `userService.js` handles email in registration, listing, and updates. `users.controller.js` returns email. `validators/common.js` normalizes email with `emailSchema` (trim + lowercase + z.email()). `env.js`, `.env.example`, `seedAdmin.js` include `SEED_ADMIN_EMAIL`. Validator tests pass.<br>**Client:** `AuthContext.jsx` stores `email` in user state on login. `pages/admin/Users.jsx` includes `type="email"` in `UserForm` (create and edit) and an "אימייל" table column. `pages/shared/Profile.jsx` displays and edits `email` with `type="email"`, syncing updates to AuthContext. |
| **Item 2: user `id` is now a UUID** | **DONE** | `schema.sql` defines `id uuid primary key default gen_random_uuid()`. `validators/common.js` defines `userUuid = z.uuid({ error: "id must be a UUID" })`. `admin.users.validator.js` enforces `userUuid` on `:id` param. `authService.js` and `userRepository.js` serialize `id` as `String(user.id)`. Zero numeric coercions (`parseInt`, `Number`, `z.coerce.number`) on user IDs exist in server or client. Client uses string keys. Validator tests pass. |
| **Item 3: booleans arriving as strings** | **DONE** | `validators/common.js` defines `queryBoolean = z.stringbool()`. `admin.users.validator.js` and `classes.validator.js` use `queryBoolean`. Dates in queries/bodies normalized with `z.coerce.date()`. `middleware/validate.js` writes parsed types to `req.validated`. All controllers consistently read from `req.validated`. Middleware and validator tests pass. |
| **Item 4: MongoDB connection & async/await deep audit** | **DONE** | `config/mongo.js` memoizes connection promise in `connecting`, handles errors, and resets state. Accessors `getDb()` and `getCollection()` throw if called before connection. Repositories lazily call `col() = () => getCollection(COLLECTION)`. `server.js` bootstraps in order: env -> `connectMongo()` -> `ensureIndexes()` -> `app.listen()`. Repositories await driver calls and return serialized docs. Unit test `mongo.connection.test.js` passes. |
| **Item 5: full audit, find and fix other problems** | **DONE** | 1. Removed 3 empty 0-byte placeholder test files (`gradeService.test.js`, `ownership.test.js`, `riskIndexService.test.js`) from `server/tests/` that were failing `npm test`.<br>2. Removed 3 empty 0-byte unused placeholder files (`api/analytics.js`, `api/announcements.js`, `api/messages.js`) from `client/src/api/`.<br>3. Verified child student ID is included in `GET /api/parents/my-child` response (`studentService.js`).<br>4. Verified form update contract between teacher form modal (`newDeadline`) and server validator/controller.<br>5. Verified CSS uses logical RTL properties.<br>6. Verified security controls: login rate limiter, helmet, CORS origin restriction, JSON body limit (100kb), HS256 pinned JWT verification, regex escaping. |

