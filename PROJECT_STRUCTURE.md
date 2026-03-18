# Project Structure Overview

trigger

## Directory Tree

```
portfolio-cms-backend/
│
├── 📄 package.json                 (Project configuration & dependencies)
├── 📄 .env                        (Environment variables - DO NOT COMMIT)
├── 📄 .gitignore                  (Git ignore rules)
├── 📄 README.md                   (Main documentation)
├── 📄 API_DOCUMENTATION.md        (API endpoints documentation)
├── 📄 API_TESTING.md              (API testing examples)
├── 📄 SETUP_GUIDE.md              (Setup & quick start guide)
├── 📄 PROJECT_STRUCTURE.md        (This file)
│
├── prisma/
│   ├── 📄 schema.prisma           (Database schema definition)
│   ├── 📄 migration_lock.toml     (Migration lock file)
│   └── migrations/                (Database migrations folder)
│       └── 20260110133527_init/
│           └── migration.sql      (Initial migration)
│
└── src/                           (Source code - Main folder)
    │
    ├── 📄 app.js                  (Express app setup)
    ├── 📄 server.js               (Server startup)
    ├── 📄 routes.js               (Main route aggregator)
    │
    ├── config/                    (Configuration files)
    │   ├── 📄 env.js              (Environment variables handler)
    │   ├── 📄 jwt.js              (JWT configuration)
    │   └── 📄 index.js            (Config exports)
    │
    ├── modules/                   (Feature modules)
    │   │
    │   └── auth/                  (Authentication module)
    │       ├── 📄 auth.controller.js      (Request handlers)
    │       ├── 📄 auth.service.js         (Business logic)
    │       ├── 📄 auth.repository.js      (Database queries)
    │       ├── 📄 auth.routes.js          (Route definitions)
    │       └── 📄 index.js                (Module exports)
    │
    ├── middlewares/               (Express middlewares)
    │   ├── 📄 auth.middleware.js   (JWT verification)
    │   └── 📄 error.middleware.js  (Global error handler)
    │
    ├── utils/                     (Utility functions)
    │   ├── 📄 hash.js             (Password hashing)
    │   ├── 📄 jwt.js              (Token utilities)
    │   ├── 📄 validator.js        (Input validation)
    │   ├── 📄 errors.js           (Custom error classes)
    │   └── 📄 index.js            (Utils exports)
    │
    ├── constants/                 (Constants & enums)
    │   ├── 📄 roles.js            (User roles & permissions)
    │   └── 📄 http.js             (HTTP status & messages)
    │
    └── prisma/                    (Database layer)
        └── 📄 client.js           (Prisma client instance)
```

---

## File Descriptions

### Root Level Files

| File                   | Purpose                                 |
| ---------------------- | --------------------------------------- |
| `package.json`         | Project metadata, dependencies, scripts |
| `.env`                 | Environment variables (NOT in git)      |
| `.gitignore`           | Git ignore rules                        |
| `README.md`            | Main project documentation              |
| `API_DOCUMENTATION.md` | Detailed API endpoints documentation    |
| `API_TESTING.md`       | Examples for testing APIs               |
| `SETUP_GUIDE.md`       | Setup instructions and checklist        |

### `src/` - Source Code

#### Core Files

| File        | Responsibility                                               |
| ----------- | ------------------------------------------------------------ |
| `app.js`    | Express app initialization, middleware setup, error handling |
| `server.js` | Server startup, graceful shutdown handling                   |
| `routes.js` | Central route aggregation for all modules                    |

#### `src/config/` - Configuration

| File       | Purpose                               |
| ---------- | ------------------------------------- |
| `env.js`   | Load & validate environment variables |
| `jwt.js`   | JWT token generation & verification   |
| `index.js` | Centralized exports                   |

#### `src/modules/` - Feature Modules

Currently contains `auth/` module with:

| File                 | MVC Role   | Responsibility                             |
| -------------------- | ---------- | ------------------------------------------ |
| `auth.controller.js` | Controller | Handle HTTP requests/responses             |
| `auth.service.js`    | Service    | Business logic, validation, error handling |
| `auth.repository.js` | Repository | Database queries, Prisma operations        |
| `auth.routes.js`     | Routes     | Define endpoints, mount controllers        |

#### `src/middlewares/` - Express Middlewares

| File                  | Purpose                                   |
| --------------------- | ----------------------------------------- |
| `auth.middleware.js`  | JWT token verification & user extraction  |
| `error.middleware.js` | Global error handler, status code mapping |

#### `src/utils/` - Utility Functions

| File           | Purpose                                               |
| -------------- | ----------------------------------------------------- |
| `hash.js`      | Password hashing with bcryptjs                        |
| `jwt.js`       | Token generation & verification helpers               |
| `validator.js` | Input validation (email, password, name)              |
| `errors.js`    | Custom error classes (AppError, ValidationError, etc) |
| `index.js`     | Centralized exports                                   |

#### `src/constants/` - Constants & Enums

| File       | Contains                                  |
| ---------- | ----------------------------------------- |
| `roles.js` | User roles, permissions (for future use)  |
| `http.js`  | HTTP status codes, error/success messages |

#### `src/prisma/` - Database Layer

| File        | Purpose                          |
| ----------- | -------------------------------- |
| `client.js` | Prisma client singleton instance |

### `prisma/` - Database

| File/Folder           | Purpose                    |
| --------------------- | -------------------------- |
| `schema.prisma`       | Database schema definition |
| `migrations/`         | Database migration files   |
| `migration_lock.toml` | Migration lock file        |

---

## Module Structure Pattern

Each feature module follows MVC + Repository pattern:

```
modules/
└── feature-name/
    ├── feature.controller.js      # Handle HTTP requests
    ├── feature.service.js         # Business logic
    ├── feature.repository.js      # Database operations
    ├── feature.routes.js          # Route definitions
    └── index.js                   # Module exports
```

### Data Flow

```
Request
   ↓
Routes → Controller → Service → Repository → Database
   ↑                                         ↓
Response ← Controller ← Service ← Data ←────
```

---

## Future Module Additions

### Phase 2: User Module

```
src/modules/user/
├── user.controller.js
├── user.service.js
├── user.repository.js
├── user.routes.js
└── index.js
```

### Phase 3: Project Module

```
src/modules/project/
├── project.controller.js
├── project.service.js
├── project.repository.js
├── project.routes.js
└── index.js
```

### Phase 4: CMS Table/Column/Row/Cell Modules

Similar structure for each CMS component

---

## Import Conventions

### From Config

```javascript
import config from "./config/env.js";
import { JwtConfig } from "./config/jwt.js";
```

### From Utils

```javascript
import { HashUtil } from "./utils/hash.js";
import { JwtUtil } from "./utils/jwt.js";
import Validator from "./utils/validator.js";
import { ConflictError, ValidationError } from "./utils/errors.js";
```

### From Modules

```javascript
import AuthController from "./modules/auth/auth.controller.js";
import AuthService from "./modules/auth/auth.service.js";
import AuthRepository from "./modules/auth/auth.repository.js";
```

### From Prisma

```javascript
import prisma from "./prisma/client.js";
```

---

## Environment Variable Mapping

| Variable       | Used In                | Purpose                      |
| -------------- | ---------------------- | ---------------------------- |
| `DATABASE_URL` | `src/prisma/client.js` | Prisma database connection   |
| `JWT_SECRET`   | `src/config/jwt.js`    | Token signing & verification |
| `FRONTEND_URL` | `src/app.js`           | CORS origin configuration    |
| `NODE_ENV`     | Various                | Environment detection        |
| `PORT`         | `src/server.js`        | Server port                  |

---

## Architecture Decisions

### 1. **ES Modules** (`"type": "module"`)

- Modern JavaScript syntax
- Better tree-shaking
- Cleaner imports/exports

### 2. **MVC + Repository Pattern**

```
Request → Controller → Service → Repository → Database
```

- **Controller**: HTTP handling
- **Service**: Business logic
- **Repository**: Data access

### 3. **Centralized Error Handling**

- Custom error classes in `src/utils/errors.js`
- Global error middleware in `src/middlewares/error.middleware.js`
- Consistent error responses

### 4. **JWT Token Strategy**

- Access Token: 7 days
- Refresh Token: 30 days
- Separate token types in payload

### 5. **Validation Layer**

- Input validation in Service layer
- Validator utility class
- Custom error throwing

### 6. **Configuration Management**

- Single config file: `src/config/env.js`
- Environment validation on startup
- Safe defaults

---

## Best Practices Implemented

✅ **Separation of Concerns** - Each file has single responsibility  
✅ **DRY (Don't Repeat Yourself)** - Reusable utilities and classes  
✅ **Error Handling** - Custom error classes with proper status codes  
✅ **Input Validation** - Dedicated validator utility  
✅ **Configuration** - Centralized env management  
✅ **Security** - Password hashing, JWT validation, CORS  
✅ **Middleware Pipeline** - Clean request/response flow  
✅ **Module Exports** - Centralized index.js for each folder  
✅ **Documentation** - Multiple guide files  
✅ **ES Modules** - Modern JavaScript syntax

---

## Scalability Notes

### Adding New Modules

1. Create `src/modules/feature-name/` folder
2. Add controller, service, repository, routes files
3. Create `index.js` with exports
4. Add routes to `src/routes.js`

### Adding New Utilities

1. Create file in `src/utils/`
2. Export in `src/utils/index.js`
3. Use centralized imports in other files

### Adding New Middleware

1. Create file in `src/middlewares/`
2. Import and use in `src/app.js`

---

**Last Updated**: January 10, 2026  
**Project Status**: Production Ready (Phase 1)
