# Project Structure Overview — Clean Architecture

## Directory Tree

```
backend-staging/
│
├── 📄 package.json                     (Project configuration & dependencies)
├── 📄 .env                            (Environment variables - DO NOT COMMIT)
├── 📄 .gitignore                      (Git ignore rules)
├── 📄 README.md                       (Main documentation)
├── 📄 API_DOCUMENTATION.md            (API endpoints documentation)
├── 📄 API_TESTING.md                  (API testing examples)
├── 📄 SETUP_GUIDE.md                  (Setup & quick start guide)
├── 📄 PROJECT_STRUCTURE.md            (This file)
├── 📄 eslint.config.js                (ESLint flat configuration)
│
├── api/
│   └── 📄 index.js                    (Vercel Serverless entrypoint)
│
├── prisma/
│   ├── 📄 schema.prisma               (Database schema definition)
│   ├── 📄 migration_lock.toml         (Migration lock file)
│   └── migrations/                    (Database migrations folder)
│
└── src/                               (Source code - Clean Architecture)
    │
    ├── 📄 app.js                      (Entrypoint re-export for Vercel/tests)
    ├── 📄 server.js                   (Entrypoint re-export for local node server)
    ├── 📄 container.js                (IoC Container / Composition Root)
    │
    ├── entities/                      # Enterprise Business Rules (Innermost Layer)
    │   ├── constants/
    │   │   ├── 📄 http.js             (HTTP status codes, standard messages)
    │   │   └── 📄 roles.js            (User roles & permissions)
    │   └── errors/
    │       └── 📄 index.js            (Custom domain error hierarchy)
    │
    ├── use-cases/                     # Application Business Rules
    │   ├── apikey/
    │   │   └── 📄 apikey.usecase.js   (API key generation & verification)
    │   ├── auth/
    │   │   └── 📄 auth.usecase.js     (Auth, profile, tokens & sessions)
    │   ├── cells/
    │   │   └── 📄 cell.usecase.js     (Cell data & image upload handling)
    │   ├── columns/
    │   │   └── 📄 column.usecase.js   (CMS column management)
    │   ├── project/
    │   │   └── 📄 project.usecase.js  (CMS project management)
    │   ├── rows/
    │   │   └── 📄 row.usecase.js      (CMS row management)
    │   └── table/
    │       └── 📄 table.usecase.js    (CMS table management & deep duplicate)
    │
    ├── adapters/                      # Interface Adapters
    │   ├── controllers/
    │   │   ├── 📄 auth.controller.js
    │   │   ├── 📄 apikey.controller.js
    │   │   ├── 📄 project.controller.js
    │   │   ├── 📄 table.controller.js
    │   │   ├── 📄 column.controller.js
    │   │   ├── 📄 row.controller.js
    │   │   ├── 📄 cell.controller.js
    │   │   └── 📄 diagnostic.controller.js
    │   ├── middleware/
    │   │   ├── 📄 auth.middleware.js
    │   │   ├── 📄 apiKey.middleware.js
    │   │   ├── 📄 error.middleware.js
    │   │   ├── 📄 requestLogger.middleware.js
    │   │   ├── 📄 sanitize.middleware.js
    │   │   └── 📄 validation.middleware.js
    │   ├── repositories/
    │   │   ├── 📄 auth.repository.js
    │   │   ├── 📄 apikey.repository.js
    │   │   ├── 📄 project.repository.js
    │   │   ├── 📄 table.repository.js
    │   │   ├── 📄 column.repository.js
    │   │   ├── 📄 row.repository.js
    │   │   └── 📄 cell.repository.js
    │   ├── routes/
    │   │   ├── 📄 auth.routes.js
    │   │   ├── 📄 apikey.routes.js
    │   │   ├── 📄 project.routes.js
    │   │   ├── 📄 table.routes.js
    │   │   ├── 📄 column.routes.js
    │   │   ├── 📄 row.routes.js
    │   │   ├── 📄 cell.routes.js
    │   │   ├── 📄 diagnostic.routes.js
    │   │   └── 📄 index.js             (Central router aggregator)
    │   └── services/
    │       ├── 📄 cloudinary.service.js
    │       ├── 📄 imageCleanup.service.js
    │       ├── 📄 hash.service.js
    │       ├── 📄 jwt.service.js
    │       ├── 📄 file.service.js
    │       ├── 📄 validator.service.js
    │       └── validation/
    │           ├── 📄 auth.validation.js
    │           ├── 📄 apikey.validation.js
    │           ├── 📄 project.validation.js
    │           ├── 📄 table.validation.js
    │           ├── 📄 column.validation.js
    │           ├── 📄 row.validation.js
    │           └── 📄 cell.validation.js
    │
    └── frameworks/                    # Frameworks & Drivers (Outermost Layer)
        ├── config/
        │   ├── 📄 env.js              (Environment loader & schema)
        │   ├── 📄 jwt.js              (JWT token signer/verifier)
        │   └── 📄 cloudinary.js       (Cloudinary client configuration)
        ├── database/
        │   └── prisma/
        │       └── 📄 client.js       (Prisma client instance)
        ├── cache/
        │   └── 📄 redis.js            (Upstash Redis cache & middlewares)
        ├── logging/
        │   └── 📄 logger.js           (Pino logger instance)
        ├── oauth/
        │   └── 📄 google-oauth.js     (Passport Google Strategy setup)
        ├── monitoring/
        │   └── 📄 sentry.js           (Sentry monitoring initialization)
        ├── docs/
        │   ├── 📄 swagger.js          (OpenAPI/Swagger setup)
        │   ├── components/
        │   │   └── 📄 schemas.js
        │   └── paths/
        │       ├── 📄 auth.js
        │       └── 📄 apikey.js
        └── web/
            ├── 📄 app.js              (Express app configuration)
            └── 📄 server.js           (HTTP server bootstrap & graceful shutdown)
```

---

## Clean Architecture Layers

### 1. Entities (`src/entities/`)
- Enterprise domain definitions, custom error classes, HTTP constants, and domain roles.
- Zero dependencies on any outer layers.

### 2. Use Cases (`src/use-cases/`)
- Pure application business logic.
- Accept dependencies (repositories, gateways/services) via constructor injection.
- Zero dependencies on HTTP/Express framework objects (`req`, `res`).

### 3. Interface Adapters (`src/adapters/`)
- `controllers/`: Handles Express `req`/`res`, invokes use cases, sets cookies, maps responses.
- `middleware/`: HTTP middlewares (Authentication, API Key, Validation, Sanitization, Logging, Global Error).
- `repositories/`: Data access implementations via Prisma.
- `routes/`: Route definitions binding controllers and middlewares.
- `services/`: Helper and SDK adapters (Bcrypt, JWT, Cloudinary, File, ImageCleanup, Joi schemas).

### 4. Frameworks & Drivers (`src/frameworks/`)
- Third-party tools, databases, cache clients, OAuth strategies, monitoring (Sentry), OpenAPI docs, and Express web application wiring.

### 5. Dependency Injection Root (`src/container.js`)
- Single composition root responsible for instantiating and wiring all dependencies.
