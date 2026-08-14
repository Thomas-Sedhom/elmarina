# Project TODO

- [x] Review the SaaS-Subscription-Manager reference architecture and reuse the existing monolith conventions.
- [x] Resolve the role enum requirement: implemented the two explicitly named values `admin` and `broker`; the request says three values but does not name a third value.
- [x] Replace OAuth-only entry flow with secure custom phone-number/password authentication.
- [x] Extend `users` with unique phone number, securely hashed password, and the approved role enum.
- [x] Automatically seed the first admin on application startup with exact name `سيدهم بسطوروس`, phone `01023999511`, role `admin`, and a securely hashed password.
- [x] Add `broker_accounts` with transactional `total_weight` and `total_cash` summaries.
- [x] Add sheet-entry storage with date, weight, description, cash, notes, and exact type labels `شغل` / `كسر` at the UI boundary.
- [x] Add database indexes needed for broker ledger queries and safe deletion behavior.
- [x] Implement admin-only procedures for broker creation, broker listing, broker detail, and sheet-entry create/edit/delete.
- [x] Enforce broker account isolation for future broker reads and reject access to other accounts.
- [x] Build the Arabic RTL custom login screen with decorative left visual and right-side form.
- [x] Build the admin dashboard using the existing `DashboardLayout` component.
- [x] Build the page titled `جميع العملاء` with searchable broker table showing name, phone, total weight, and total cash.
- [x] Add the admin form for creating broker accounts with name, phone, and password.
- [x] Build broker detail summary cards and the full ledger table with edit/delete actions.
- [x] Build the Add/Edit sheet-entry dialog with validation and exact Arabic type labels.
- [x] Implement atomic totals logic: `شغل` adds weight/cash, `كسر` subtracts weight/cash, edit applies only the delta, and delete reverses the prior effect.
- [x] Add delete confirmation dialog and prevent partial state through a single database transaction.
- [x] Apply Arabic RTL typography, polished spacing, responsive behavior, loading/empty/error states, and premium visual styling.
- [x] Add Vitest coverage for work and breakage creation, edit delta, delete reversal, and unauthorized broker access.
- [x] Run typecheck, tests, build, and visual browser verification.
- [x] Review `todo.md` before the final checkpoint and save the single initial delivery checkpoint.
- [x] Stop exposing `passwordHash` in all auth responses and return safe user DTOs.
- [x] Add real foreign key constraints for broker account and sheet-entry relationships.
- [x] Add explicit query error states for broker list, broker detail, and ledger views.
- [x] Add backend procedure/integration-style tests for create/update/delete routing, totals rules, and cross-account access.

## MongoDB Migration Request

- [x] Review the current SQL/Drizzle persistence layer and identify all server/database/auth dependencies.
- [x] Add a `MONGODB_URI` environment variable configuration path for development and production.
- [x] Add Mongoose dependency and define User, BrokerAccount, and SheetEntry models with indexes and references.
- [x] Replace SQL database helpers and startup seed with MongoDB/Mongoose repositories.
- [x] Preserve atomic broker total updates for work, breakage, edit, and delete using MongoDB transactions where supported.
- [x] Preserve custom phone/password authentication, role guards, safe user DTOs, and router contracts.
- [x] Update tests for MongoDB repositories and transaction behavior without committing real credentials.
- [x] Validate build, typecheck, tests, and connection-missing error handling; save a new checkpoint.
- [x] Add and execute an explicit test for clean failure when `MONGODB_URI` is missing, then save the post-migration checkpoint.

## Dependency Cleanup Request

- [x] Inventory OAuth, Drizzle/SQL, and other starter dependency usage before removal.
- [x] Remove OAuth routes, SDK initialization, client helpers, and obsolete OAuth environment requirements.
- [x] Remove Drizzle schema/runtime packages/scripts and replace stale shared type exports with Mongo-compatible types.
- [x] Remove unused packages only when confirmed unreferenced; preserve tRPC, Mongoose, Express, session, and UI dependencies.
- [x] Run lockfile cleanup, typecheck, tests, build, and verify the OAuth warning is gone.
- [x] Save a cleanup checkpoint after all validations pass.

## Express Backend Rewrite Request

- [x] Review the SaaS-Subscription-Manager server module structure and map all current tRPC dependencies.
- [x] Create the Express application/module structure used by the SaaS reference, including config, middleware, routes, controllers, services, and repositories.
- [x] Move local session authentication, auth guards, and error handling to Express middleware/routes.
- [x] Move users, broker accounts, and ledger operations to Express routes while preserving MongoDB transactions and totals rules.
- [x] Replace the frontend tRPC client with a typed HTTP API client and preserve loading/error/auth behavior.
- [x] Remove tRPC server/client packages, adapters, routers, and obsolete API wiring after migration.
- [x] Add/update Express route and service tests for authentication, authorization, broker access isolation, and ledger transactions.
- [x] Run typecheck, tests, build, and startup verification; checkpoint remains the final delivery action.

## Express Architecture Completion

- [x] Add dedicated repository, service, and controller files for brokers and ledger; keep route files limited to mounting and middleware.
- [x] Add a dedicated users module boundary for the authenticated current-user endpoint, even if broker-facing portal remains out of scope.
- [x] Add request-level Express tests for auth login/me/logout, broker access control, and ledger create/update/delete endpoints.
- [x] Re-run typecheck, tests, build, startup verification, and save the Express architecture checkpoint.

## Production Startup Fix

- [x] Align the production start command and generated server artifact so deployment starts `dist/index.js` consistently.
- [x] Rebuild and verify production startup before the commit/push delivery.
