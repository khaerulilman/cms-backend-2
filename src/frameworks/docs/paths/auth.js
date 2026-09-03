/**
 * Auth API — OpenAPI Path Definitions
 *
 * Covers:
 *   POST /auth/register
 *   POST /auth/login
 *   POST /auth/refresh-token
 *   POST /auth/logout
 *   POST /auth/establish-session
 *   GET  /auth/google
 *   GET  /auth/google/callback
 *   GET  /auth/profile          (protected)
 *   POST /auth/logout-all       (protected)
 *   GET  /auth/sessions         (protected)
 */

export const authPaths = {
  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  POST /auth/register                                                    ║
  // ╚══════════════════════════════════════════════════════════════════════════╝
  "/auth/register": {
    post: {
      tags: ["Auth"],
      summary: "Register a new user",
      description:
        "Creates a new user account. On success, sets `accessToken` and `refreshToken` as HTTP-only cookies and returns the user object.",
      operationId: "registerUser",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RegisterRequest" },
            example: {
              email: "john@example.com",
              password: "secureP@ss123",
              name: "John Doe",
            },
          },
        },
      },
      responses: {
        201: {
          description: "User registered successfully",
          headers: {
            "Set-Cookie": {
              description:
                "Sets `accessToken` (15 min) and `refreshToken` (7 days) as HTTP-only cookies",
              schema: { type: "string" },
            },
          },
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/SuccessResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          user: { $ref: "#/components/schemas/User" },
                        },
                      },
                    },
                  },
                ],
              },
              example: {
                success: true,
                message: "User registered successfully",
                data: {
                  user: {
                    id: "550e8400-e29b-41d4-a716-446655440000",
                    email: "john@example.com",
                    name: "John Doe",
                    createdAt: "2026-01-15T10:30:00.000Z",
                  },
                },
              },
            },
          },
        },
        400: {
          description: "Validation error — missing or invalid fields",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ValidationErrorResponse",
              },
              examples: {
                missingFields: {
                  summary: "Missing required fields",
                  value: {
                    success: false,
                    message: "Validation error",
                    errors: [
                      { field: "email", message: "Email is required" },
                      { field: "password", message: "Password is required" },
                      { field: "name", message: "Name is required" },
                    ],
                  },
                },
                invalidEmail: {
                  summary: "Invalid email format",
                  value: {
                    success: false,
                    message: "Validation error",
                    errors: [
                      { field: "email", message: "Invalid email format" },
                    ],
                  },
                },
                weakPassword: {
                  summary: "Password too short",
                  value: {
                    success: false,
                    message: "Validation error",
                    errors: [
                      {
                        field: "password",
                        message: "Password must be at least 8 characters long",
                      },
                    ],
                  },
                },
              },
            },
          },
        },
        409: {
          description: "Conflict — email already registered",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: {
                success: false,
                message:
                  "Email already exists. Please use a different email or login instead",
              },
            },
          },
        },
        500: {
          $ref: "#/components/responses/InternalServerError",
        },
      },
    },
  },

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  POST /auth/login                                                       ║
  // ╚══════════════════════════════════════════════════════════════════════════╝
  "/auth/login": {
    post: {
      tags: ["Auth"],
      summary: "Login with email and password",
      description:
        "Authenticates a user with email & password. On success, sets HTTP-only cookies (`accessToken`, `refreshToken`) and returns the user object.",
      operationId: "loginUser",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/LoginRequest" },
            example: {
              email: "john@example.com",
              password: "secureP@ss123",
            },
          },
        },
      },
      responses: {
        200: {
          description: "Login successful",
          headers: {
            "Set-Cookie": {
              description:
                "Sets `accessToken` (15 min) and `refreshToken` (7 days) as HTTP-only cookies",
              schema: { type: "string" },
            },
          },
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/SuccessResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          user: { $ref: "#/components/schemas/User" },
                        },
                      },
                    },
                  },
                ],
              },
              example: {
                success: true,
                message: "Login successful",
                data: {
                  user: {
                    id: "550e8400-e29b-41d4-a716-446655440000",
                    email: "john@example.com",
                    name: "John Doe",
                    createdAt: "2026-01-15T10:30:00.000Z",
                  },
                },
              },
            },
          },
        },
        400: {
          description: "Validation error",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ValidationErrorResponse",
              },
              example: {
                success: false,
                message: "Validation error",
                errors: [
                  { field: "email", message: "Email is required" },
                  { field: "password", message: "Password is required" },
                ],
              },
            },
          },
        },
        401: {
          description: "Invalid credentials",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: {
                success: false,
                message: "Invalid email or password",
              },
            },
          },
        },
        500: {
          $ref: "#/components/responses/InternalServerError",
        },
      },
    },
  },

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  POST /auth/refresh-token                                               ║
  // ╚══════════════════════════════════════════════════════════════════════════╝
  "/auth/refresh-token": {
    post: {
      tags: ["Auth"],
      summary: "Refresh access token",
      description:
        "Rotates the refresh token and issues a new access token. The refresh token is read from the `refreshToken` cookie (preferred) or from the request body as fallback. The old refresh token is revoked (Refresh Token Rotation).",
      operationId: "refreshToken",
      requestBody: {
        required: false,
        description:
          "Optional — only needed if the `refreshToken` cookie is not present (e.g. mobile clients).",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                refreshToken: {
                  type: "string",
                  description: "Refresh token (fallback when cookie is absent)",
                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description:
            "Token refreshed — new cookies set, old refresh token revoked",
          headers: {
            "Set-Cookie": {
              description:
                "Sets new `accessToken` (15 min) and `refreshToken` (7 days) as HTTP-only cookies",
              schema: { type: "string" },
            },
          },
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SuccessResponse" },
              example: {
                success: true,
                message: "Token refreshed successfully",
              },
            },
          },
        },
        401: {
          description: "Invalid, expired, or revoked refresh token",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              examples: {
                invalidToken: {
                  summary: "Invalid refresh token",
                  value: {
                    success: false,
                    message: "Invalid refresh token",
                  },
                },
                revokedToken: {
                  summary: "Token has been revoked",
                  value: {
                    success: false,
                    message: "Token has been revoked",
                  },
                },
                expiredToken: {
                  summary: "Refresh token expired",
                  value: {
                    success: false,
                    message: "Refresh token has expired",
                  },
                },
              },
            },
          },
        },
        500: {
          $ref: "#/components/responses/InternalServerError",
        },
      },
    },
  },

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  POST /auth/logout                                                      ║
  // ╚══════════════════════════════════════════════════════════════════════════╝
  "/auth/logout": {
    post: {
      tags: ["Auth"],
      summary: "Logout current session",
      description:
        "Revokes the current refresh token and clears `accessToken` & `refreshToken` cookies. Safe to call even without a valid token.",
      operationId: "logoutUser",
      responses: {
        200: {
          description: "Logged out successfully",
          headers: {
            "Set-Cookie": {
              description: "Clears `accessToken` and `refreshToken` cookies",
              schema: { type: "string" },
            },
          },
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SuccessResponse" },
              example: {
                success: true,
                message: "Logout successful",
              },
            },
          },
        },
        500: {
          $ref: "#/components/responses/InternalServerError",
        },
      },
    },
  },

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  POST /auth/establish-session                                           ║
  // ╚══════════════════════════════════════════════════════════════════════════╝
  "/auth/establish-session": {
    post: {
      tags: ["Auth"],
      summary: "Establish session via setup token",
      description:
        "Exchanges a short-lived setup token (received from Google OAuth callback) for persistent HTTP-only session cookies. Intended for cross-origin scenarios where the frontend proxies this request so cookies are set on the frontend domain.",
      operationId: "establishSession",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/EstablishSessionRequest",
            },
            example: {
              setupToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
          },
        },
      },
      responses: {
        200: {
          description: "Session established — cookies set",
          headers: {
            "Set-Cookie": {
              description:
                "Sets `accessToken` (15 min) and `refreshToken` (7 days) as HTTP-only cookies",
              schema: { type: "string" },
            },
          },
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SuccessResponse" },
              example: {
                success: true,
                message: "Session established successfully",
              },
            },
          },
        },
        400: {
          description: "Missing setup token",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: {
                success: false,
                message: "Setup token is required",
              },
            },
          },
        },
        401: {
          description: "Invalid or expired setup token",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: {
                success: false,
                message: "Invalid or expired setup token",
              },
            },
          },
        },
        500: {
          $ref: "#/components/responses/InternalServerError",
        },
      },
    },
  },

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  GET /auth/google                                                       ║
  // ╚══════════════════════════════════════════════════════════════════════════╝
  "/auth/google": {
    get: {
      tags: ["Auth — OAuth"],
      summary: "Initiate Google OAuth login",
      description:
        "Redirects the user to Google's consent screen. After granting access, Google redirects back to `/auth/google/callback`.",
      operationId: "googleOAuthStart",
      responses: {
        302: {
          description: "Redirect to Google OAuth consent screen",
        },
      },
    },
  },

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  GET /auth/google/callback                                              ║
  // ╚══════════════════════════════════════════════════════════════════════════╝
  "/auth/google/callback": {
    get: {
      tags: ["Auth — OAuth"],
      summary: "Google OAuth callback",
      description:
        "Handles the redirect from Google after user grants consent. Sets HTTP-only session cookies and redirects to the frontend with user data and a short-lived setup token as query parameters.",
      operationId: "googleOAuthCallback",
      parameters: [
        {
          name: "code",
          in: "query",
          description: "Authorization code from Google (handled by Passport)",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        302: {
          description:
            "Redirect to frontend `/login` with query params: `user` (base64), `oauth=success`, `setup_token`",
          headers: {
            Location: {
              description: "Frontend URL with OAuth data as query parameters",
              schema: { type: "string" },
            },
            "Set-Cookie": {
              description:
                "Sets `accessToken` and `refreshToken` as HTTP-only cookies",
              schema: { type: "string" },
            },
          },
        },
        401: {
          description: "OAuth authentication failed — no user data from Google",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: {
                success: false,
                message: "Unauthorized",
              },
            },
          },
        },
      },
    },
  },

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  GET /auth/profile  (protected)                                         ║
  // ╚══════════════════════════════════════════════════════════════════════════╝
  "/auth/profile": {
    get: {
      tags: ["Auth"],
      summary: "Get current user profile",
      description:
        "Returns the authenticated user's profile. Requires a valid access token (cookie or Bearer header).",
      operationId: "getUserProfile",
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      responses: {
        200: {
          description: "Profile retrieved successfully",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/SuccessResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        $ref: "#/components/schemas/UserProfile",
                      },
                    },
                  },
                ],
              },
              example: {
                success: true,
                message: "Profile retrieved successfully",
                data: {
                  id: "550e8400-e29b-41d4-a716-446655440000",
                  email: "john@example.com",
                  name: "John Doe",
                  createdAt: "2026-01-15T10:30:00.000Z",
                  updatedAt: "2026-02-10T14:20:00.000Z",
                },
              },
            },
          },
        },
        401: {
          description: "Missing or invalid access token",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              examples: {
                noToken: {
                  summary: "No token provided",
                  value: {
                    success: false,
                    message: "No token provided",
                  },
                },
                invalidToken: {
                  summary: "Invalid or expired token",
                  value: {
                    success: false,
                    message: "Invalid or expired token",
                  },
                },
              },
            },
          },
        },
        404: {
          description: "User not found",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: {
                success: false,
                message: "User not found",
              },
            },
          },
        },
        500: {
          $ref: "#/components/responses/InternalServerError",
        },
      },
    },
  },

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  POST /auth/logout-all  (protected)                                     ║
  // ╚══════════════════════════════════════════════════════════════════════════╝
  "/auth/logout-all": {
    post: {
      tags: ["Auth"],
      summary: "Logout from all devices",
      description:
        "Revokes **all** active refresh tokens for the user and clears session cookies. Useful when a user suspects their account is compromised.",
      operationId: "logoutAllDevices",
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      responses: {
        200: {
          description: "Logged out from all devices",
          headers: {
            "Set-Cookie": {
              description: "Clears `accessToken` and `refreshToken` cookies",
              schema: { type: "string" },
            },
          },
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SuccessResponse" },
              example: {
                success: true,
                message: "Logged out from all devices successfully",
              },
            },
          },
        },
        401: {
          description: "Missing or invalid access token",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: {
                success: false,
                message: "No token provided",
              },
            },
          },
        },
        500: {
          $ref: "#/components/responses/InternalServerError",
        },
      },
    },
  },

  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  GET /auth/sessions  (protected)                                        ║
  // ╚══════════════════════════════════════════════════════════════════════════╝
  "/auth/sessions": {
    get: {
      tags: ["Auth"],
      summary: "Get active sessions",
      description:
        "Returns a list of the user's currently active (non-revoked, non-expired) refresh tokens with device metadata.",
      operationId: "getActiveSessions",
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      responses: {
        200: {
          description: "Active sessions retrieved",
          content: {
            "application/json": {
              schema: {
                allOf: [
                  { $ref: "#/components/schemas/SuccessResponse" },
                  {
                    type: "object",
                    properties: {
                      data: {
                        type: "object",
                        properties: {
                          sessions: {
                            type: "array",
                            items: {
                              $ref: "#/components/schemas/Session",
                            },
                          },
                        },
                      },
                    },
                  },
                ],
              },
              example: {
                success: true,
                message: "Active sessions retrieved successfully",
                data: {
                  sessions: [
                    {
                      id: "660e8400-e29b-41d4-a716-446655440000",
                      userAgent:
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                      ipAddress: "192.168.1.1",
                      createdAt: "2026-02-15T08:00:00.000Z",
                      expiresAt: "2026-02-22T08:00:00.000Z",
                    },
                    {
                      id: "770e8400-e29b-41d4-a716-446655440000",
                      userAgent: "PostmanRuntime/7.36.0",
                      ipAddress: "10.0.0.5",
                      createdAt: "2026-02-14T12:00:00.000Z",
                      expiresAt: "2026-02-21T12:00:00.000Z",
                    },
                  ],
                },
              },
            },
          },
        },
        401: {
          description: "Missing or invalid access token",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              example: {
                success: false,
                message: "No token provided",
              },
            },
          },
        },
        500: {
          $ref: "#/components/responses/InternalServerError",
        },
      },
    },
  },
};

export default authPaths;
