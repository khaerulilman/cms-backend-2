import swaggerUi from 'swagger-ui-express';

import { config } from '../config/env.js';

import { schemas, securitySchemes } from './components/schemas.js';
import { authPaths } from './paths/auth.js';
import { apikeyPaths } from './paths/apikey.js';

const prefixPaths = (paths, basePath) =>
  Object.fromEntries(
    Object.entries(paths).map(([path, definition]) => [
      `${basePath}${path}`,
      definition,
    ]),
  );

const apiVersion = '1.0.0';
const basePath = '/api/v1';

const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Portfolio CMS API',
    version: apiVersion,
    description: `
RESTful API for the Portfolio CMS — manage projects, tables, columns, rows, and cells.

## Authentication

This API uses **HTTP-only cookie-based authentication**.  
On successful login or register, the server sets two cookies:

| Cookie         | Lifetime | Purpose                |
|----------------|----------|------------------------|
| \`accessToken\`  | 15 min   | Short-lived JWT for API calls |
| \`refreshToken\` | 7 days   | Used to rotate & get new access tokens |

For environments where cookies are not available (e.g. mobile apps), pass the access token via the \`Authorization: Bearer <token>\` header.

## Rate Limiting & Security
- Input is sanitized via XSS middleware
- Refresh tokens are **rotated** on every use (old token is revoked)
- Google OAuth 2.0 is supported as an alternative login method
    `,
    contact: {
      name: 'Portfolio CMS API Support',
    },
    license: {
      name: 'MIT',
    },
  },
  servers: [
    {
      url:
        config.NODE_ENV === 'production'
          ? '{productionUrl}'
          : `http://localhost:${config.PORT || 3000}`,
      description:
        config.NODE_ENV === 'production' ? 'Production' : 'Development',
      variables:
        config.NODE_ENV === 'production'
          ? {
              productionUrl: {
                default: 'https://api.example.com',
                description: 'Production server URL',
              },
            }
          : undefined,
    },
  ],
  tags: [
    {
      name: 'Auth',
      description:
        'Registration, login, logout, token refresh, profile & session management',
    },
    {
      name: 'Auth — OAuth',
      description: 'Google OAuth 2.0 authentication flow',
    },
    {
      name: 'API Key',
      description:
        'Generate, retrieve, and delete API keys for server-to-server authentication',
    },
  ],

  paths: {
    ...prefixPaths(authPaths, basePath),
    ...prefixPaths(apikeyPaths, basePath),
  },

  components: {
    schemas,
    securitySchemes,
    responses: {
      InternalServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorResponse' },
            example: {
              success: false,
              message: 'Internal server error',
            },
          },
        },
      },
    },
  },
};

const swaggerUiOptions = {
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { font-size: 2rem; }
  `,
  customSiteTitle: 'Portfolio CMS API Docs',
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'list',
    filter: true,
    displayRequestDuration: true,
    tryItOutEnabled: true,
  },
};

export const setupSwagger = (app, path = '/api-docs') => {
  app.use(
    path,
    swaggerUi.serve,
    swaggerUi.setup(openApiDocument, swaggerUiOptions),
  );

  app.get(`${path}/json`, (_req, res) => {
    res.json(openApiDocument);
  });
};

export { openApiDocument };
export default setupSwagger;
