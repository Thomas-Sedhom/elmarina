# SaaS Reference Architecture Notes

Reference repository: https://github.com/Thomas-Sedhom/SaaS-Subscription-Manager

The reference server uses `server/src/app.ts` for Express app construction, `server/src/server.ts` for startup, and `server/src/routes.ts` for route mounting. Feature modules under `server/src/modules` are split into `{feature}.routes.ts`, `{feature}.controller.ts`, `{feature}.service.ts`, `{feature}.repository.ts`, and `{feature}.types.ts`. Shared cross-cutting code is under `server/src/shared`, including `middlewares/auth.middleware.ts`, `role.middleware.ts`, `validate.middleware.ts`, `errors/app-error.ts`, `errors/error-handler.ts`, `services/jwt.service.ts`, and response/async utilities.

The Elmarina migration currently follows this target shape for auth and brokers, and is completing the same boundaries for ledger and users. The application-specific persistence remains MongoDB/Mongoose through the existing repository layer, while Express controllers expose HTTP endpoints under `/api/auth`, `/api/users`, `/api/brokers`, and `/api/entries`.
