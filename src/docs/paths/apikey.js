/**
 * API Key API — OpenAPI Path Definitions
 *
 * Covers:
 *   POST /apikey           (protected) - Generate new API key
 *   GET  /apikey           (protected) - List all API keys
 *   DELETE /apikey/:apiKeyId (protected) - Delete API key
 *
 * API Keys are used for server-to-server or client authentication via the
 * `X-API-Key` header. Each key is generated with a cryptographically random
 * value (format: `sk_<32 chars>`). On creation, the full key is shown once—
 * after that, only masked versions are displayed for security.
 */

export const apikeyPaths = {
  // ╔══════════════════════════════════════════════════════════════════════════╗
  // ║  POST /apikey  (protected)                                              ║
  // ╚══════════════════════════════════════════════════════════════════════════╝
  "/apikey": {
    post: {
      tags: ["API Key"],
      summary: "Generate a new API key",
      description:
        "Creates a new API key for the authenticated user. The full API key is displayed only once on creation. After that, only masked versions are shown. API keys are used to authenticate requests via the `X-API-Key` header.",
      operationId: "generateApiKey",
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      responses: {
        201: {
          description: "API key generated successfully",
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
                          id: {
                            type: "string",
                            format: "uuid",
                            example: "770e8400-e29b-41d4-a716-446655440000",
                          },
                          apiKey: {
                            type: "string",
                            description:
                              "Full API key — save this securely! You won't see it again.",
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
                    },
                  },
                ],
              },
              example: {
                success: true,
                message: "API key generated successfully",
                data: {
                  id: "770e8400-e29b-41d4-a716-446655440000",
                  apiKey: "sk_AbCdEfGhIjKlMnOpQrStUvWxYz123456",
                  createdAt: "2026-02-15T10:00:00.000Z",
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

    // ╔════════════════════════════════════════════════════════════════════════╗
    // ║  GET /apikey  (protected)                                             ║
    // ╚════════════════════════════════════════════════════════════════════════╝
    get: {
      tags: ["API Key"],
      summary: "List all API keys",
      description:
        "Returns all API keys belonging to the authenticated user. API keys are returned in **masked** form (only first 4 and last 4 characters shown) for security.",
      operationId: "getApiKeys",
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      responses: {
        200: {
          description: "API keys retrieved successfully",
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
                          userId: {
                            type: "string",
                            format: "uuid",
                            example: "550e8400-e29b-41d4-a716-446655440000",
                          },
                          apiKeys: {
                            type: "array",
                            items: {
                              $ref: "#/components/schemas/ApiKeyMasked",
                            },
                          },
                          total: {
                            type: "integer",
                            minimum: 0,
                            example: 2,
                          },
                        },
                        required: ["userId", "apiKeys", "total"],
                      },
                    },
                  },
                ],
              },
              example: {
                success: true,
                message: "API keys retrieved successfully",
                data: {
                  userId: "550e8400-e29b-41d4-a716-446655440000",
                  apiKeys: [
                    {
                      id: "770e8400-e29b-41d4-a716-446655440000",
                      apiKey: "sk_Ab**************************z456",
                      createdAt: "2026-02-15T10:00:00.000Z",
                      updatedAt: "2026-02-15T10:00:00.000Z",
                    },
                    {
                      id: "880e8400-e29b-41d4-a716-446655440000",
                      apiKey: "sk_Xy**************************Ab12",
                      createdAt: "2026-02-14T14:30:00.000Z",
                      updatedAt: "2026-02-14T14:30:00.000Z",
                    },
                  ],
                  total: 2,
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
  // ║  DELETE /apikey/:apiKeyId  (protected)                                  ║
  // ╚══════════════════════════════════════════════════════════════════════════╝
  "/apikey/{apiKeyId}": {
    delete: {
      tags: ["API Key"],
      summary: "Delete an API key",
      description:
        "Deletes a specific API key by ID. Once deleted, requests using that API key will be rejected. This action cannot be undone.",
      operationId: "deleteApiKey",
      security: [{ cookieAuth: [] }, { bearerAuth: [] }],
      parameters: [
        {
          name: "apiKeyId",
          in: "path",
          description: "UUID of the API key to delete",
          required: true,
          schema: {
            type: "string",
            format: "uuid",
            example: "770e8400-e29b-41d4-a716-446655440000",
          },
        },
      ],
      responses: {
        200: {
          description: "API key deleted successfully",
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
                          deletedId: {
                            type: "string",
                            format: "uuid",
                            example: "770e8400-e29b-41d4-a716-446655440000",
                          },
                        },
                        required: ["deletedId"],
                      },
                    },
                  },
                ],
              },
              example: {
                success: true,
                message: "API key deleted successfully",
                data: {
                  deletedId: "770e8400-e29b-41d4-a716-446655440000",
                },
              },
            },
          },
        },
        400: {
          description: "Invalid API key ID format",
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/ValidationErrorResponse",
              },
              example: {
                success: false,
                message: "Validation error",
                errors: [
                  {
                    field: "apiKeyId",
                    message: "API key ID must be a valid UUID",
                  },
                ],
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
        404: {
          description: "API key not found or does not belong to user",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
              examples: {
                notFound: {
                  summary: "API key not found",
                  value: {
                    success: false,
                    message: "API key not found",
                  },
                },
                notOwned: {
                  summary: "API key does not belong to user",
                  value: {
                    success: false,
                    message: "API key not found",
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
};

export default apikeyPaths;
