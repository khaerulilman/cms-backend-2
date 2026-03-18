/**
 * Shared OpenAPI component schemas
 * Reusable across all endpoint documentation
 */

export const schemas = {
  // ─── Common Response Wrappers ──────────────────────────────────────────────

  SuccessResponse: {
    type: "object",
    properties: {
      success: {
        type: "boolean",
        example: true,
      },
      message: {
        type: "string",
      },
    },
    required: ["success", "message"],
  },

  ErrorResponse: {
    type: "object",
    properties: {
      success: {
        type: "boolean",
        example: false,
      },
      message: {
        type: "string",
      },
    },
    required: ["success", "message"],
  },

  ValidationErrorResponse: {
    type: "object",
    properties: {
      success: {
        type: "boolean",
        example: false,
      },
      message: {
        type: "string",
        example: "Validation error",
      },
      errors: {
        type: "array",
        items: {
          type: "object",
          properties: {
            field: {
              type: "string",
              example: "email",
            },
            message: {
              type: "string",
              example: "Invalid email format",
            },
          },
        },
      },
    },
  },

  // ─── Domain Models ────────────────────────────────────────────────────────

  User: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "uuid",
        example: "550e8400-e29b-41d4-a716-446655440000",
      },
      email: {
        type: "string",
        format: "email",
        example: "user@example.com",
      },
      name: {
        type: "string",
        example: "John Doe",
      },
      createdAt: {
        type: "string",
        format: "date-time",
        example: "2026-01-15T10:30:00.000Z",
      },
    },
    required: ["id", "email", "name", "createdAt"],
  },

  UserProfile: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "uuid",
        example: "550e8400-e29b-41d4-a716-446655440000",
      },
      email: {
        type: "string",
        format: "email",
        example: "user@example.com",
      },
      name: {
        type: "string",
        example: "John Doe",
      },
      createdAt: {
        type: "string",
        format: "date-time",
        example: "2026-01-15T10:30:00.000Z",
      },
      updatedAt: {
        type: "string",
        format: "date-time",
        example: "2026-02-10T14:20:00.000Z",
      },
    },
    required: ["id", "email", "name", "createdAt", "updatedAt"],
  },

  Session: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "uuid",
        example: "660e8400-e29b-41d4-a716-446655440000",
      },
      userAgent: {
        type: "string",
        example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        nullable: true,
      },
      ipAddress: {
        type: "string",
        example: "192.168.1.1",
        nullable: true,
      },
      createdAt: {
        type: "string",
        format: "date-time",
        example: "2026-02-15T08:00:00.000Z",
      },
      expiresAt: {
        type: "string",
        format: "date-time",
        example: "2026-02-22T08:00:00.000Z",
      },
    },
    required: ["id", "createdAt", "expiresAt"],
  },

  // ─── Auth Request Bodies ──────────────────────────────────────────────────

  RegisterRequest: {
    type: "object",
    properties: {
      email: {
        type: "string",
        format: "email",
        description: "User email address (will be lowercased and trimmed)",
        example: "user@example.com",
      },
      password: {
        type: "string",
        format: "password",
        minLength: 8,
        description: "Password (minimum 8 characters)",
        example: "secureP@ss123",
      },
      name: {
        type: "string",
        minLength: 2,
        maxLength: 100,
        description: "User display name (2-100 characters)",
        example: "John Doe",
      },
    },
    required: ["email", "password", "name"],
  },

  LoginRequest: {
    type: "object",
    properties: {
      email: {
        type: "string",
        format: "email",
        description: "Registered email address",
        example: "user@example.com",
      },
      password: {
        type: "string",
        format: "password",
        description: "Account password",
        example: "secureP@ss123",
      },
    },
    required: ["email", "password"],
  },

  EstablishSessionRequest: {
    type: "object",
    properties: {
      setupToken: {
        type: "string",
        description:
          "Short-lived setup token received from Google OAuth callback",
        example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      },
    },
    required: ["setupToken"],
  },

  // ─── API Key Models ───────────────────────────────────────────────────────

  ApiKey: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "uuid",
        example: "770e8400-e29b-41d4-a716-446655440000",
      },
      apiKey: {
        type: "string",
        description:
          "Full API key (only visible once on creation). Format: sk_<32chars>",
        example: "sk_AbCdEfGhIjKlMnOpQrStUvWxYz123456",
      },
      createdAt: {
        type: "string",
        format: "date-time",
        example: "2026-02-15T10:00:00.000Z",
      },
    },
    required: ["id", "apiKey", "createdAt"],
  },

  ApiKeyMasked: {
    type: "object",
    properties: {
      id: {
        type: "string",
        format: "uuid",
        example: "770e8400-e29b-41d4-a716-446655440000",
      },
      apiKey: {
        type: "string",
        description:
          "Masked API key showing only first 4 and last 4 characters (for security). Format: sk_**...***456",
        example: "sk_Ab**************************z456",
      },
      createdAt: {
        type: "string",
        format: "date-time",
        example: "2026-02-15T10:00:00.000Z",
      },
      updatedAt: {
        type: "string",
        format: "date-time",
        example: "2026-02-15T10:00:00.000Z",
      },
    },
    required: ["id", "apiKey", "createdAt", "updatedAt"],
  },
};

export const securitySchemes = {
  cookieAuth: {
    type: "apiKey",
    in: "cookie",
    name: "accessToken",
    description:
      "JWT access token stored as HTTP-only cookie. Automatically set on login/register.",
  },
  bearerAuth: {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
    description:
      "JWT access token passed via Authorization header. Fallback when cookies are unavailable.",
  },
};

export default { schemas, securitySchemes };
