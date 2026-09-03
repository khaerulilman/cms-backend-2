export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
};

export const SUCCESS_MESSAGES = {
  // Auth
  USER_REGISTERED: 'User registered successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logged out successfully',
  LOGOUT_ALL_SUCCESS: 'Logged out from all devices successfully',
  TOKEN_REFRESHED: 'Token refreshed successfully',
  PROFILE_RETRIEVED: 'Profile retrieved successfully',
  SESSIONS_RETRIEVED: 'Active sessions retrieved successfully',

  // Projects
  PROJECT_CREATED: 'Project created successfully',
  PROJECT_RETRIEVED: 'Project retrieved successfully',
  PROJECTS_RETRIEVED: 'Projects retrieved successfully',
  PROJECT_UPDATED: 'Project updated successfully',
  PROJECT_DELETED: 'Project deleted successfully',

  // Tables
  TABLE_CREATED: 'Table created successfully',
  TABLE_RETRIEVED: 'Table retrieved successfully',
  TABLES_RETRIEVED: 'Tables retrieved successfully',
  TABLE_UPDATED: 'Table updated successfully',
  TABLE_DELETED: 'Table deleted successfully',

  // Columns
  COLUMNS_CREATED: 'Columns created successfully',
  COLUMN_RETRIEVED: 'Column retrieved successfully',
  COLUMNS_RETRIEVED: 'Columns retrieved successfully',
  COLUMN_UPDATED: 'Column updated successfully',
  COLUMN_DELETED: 'Column deleted successfully',

  // Rows
  ROW_CREATED: 'Row created successfully',
  ROW_RETRIEVED: 'Row retrieved successfully',
  ROWS_RETRIEVED: 'Rows retrieved successfully',
  ROW_UPDATED: 'Row updated successfully',
  ROW_DELETED: 'Row deleted successfully',
  ROWS_DELETED: 'Rows deleted successfully',

  // Cells
  CELL_UPSERTED: 'Cell updated successfully',
  CELLS_RETRIEVED: 'Cells retrieved successfully',

  // API Keys
  API_KEY_GENERATED: 'API key generated successfully',
  API_KEYS_RETRIEVED: 'API keys retrieved successfully',
  API_KEY_DELETED: 'API key deleted successfully',
};

export const ERROR_MESSAGES = {
  // Common
  INTERNAL_SERVER_ERROR: 'Internal server error',
  VALIDATION_ERROR: 'Validation error',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Forbidden access',

  // Auth
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Please provide a valid email',
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_WEAK: 'Password must be at least 8 characters',
  NAME_REQUIRED: 'Name is required',
  NAME_TOO_SHORT: 'Name must be at least 2 characters',
  NAME_TOO_LONG: 'Name cannot exceed 100 characters',
  INVALID_CREDENTIALS: 'Email atau password salah',
  USER_ALREADY_EXISTS: 'User with this email already exists',
  USER_NOT_FOUND: 'User not found',
  NO_TOKEN_PROVIDED: 'No authentication token provided',
  INVALID_TOKEN: 'Invalid or expired authentication token',
  INVALID_REFRESH_TOKEN: 'Invalid refresh token',
  REFRESH_TOKEN_EXPIRED: 'Refresh token has expired',
  TOKEN_REVOKED: 'Refresh token has been revoked',

  // Projects
  PROJECT_NOT_FOUND: 'Project not found',
  PROJECT_NAME_REQUIRED: 'Project name is required',

  // Tables
  TABLE_NOT_FOUND: 'Table not found',
  TABLE_ID_REQUIRED: 'Table ID is required',
  INVALID_TABLE_ID: 'Table ID must be a valid UUID',

  // Columns
  COLUMN_NOT_FOUND: 'Column not found',
  COLUMN_ID_REQUIRED: 'Column ID is required',
  INVALID_COLUMN_ID: 'Column ID must be a valid UUID',
  COLUMNS_REQUIRED: 'Columns are required',
  COLUMNS_EMPTY: 'At least one column is required',
  COLUMN_NAME_REQUIRED: 'Column name is required',
  COLUMN_NAME_EMPTY: 'Column name cannot be empty',
  COLUMN_NAME_TOO_LONG: 'Column name cannot exceed 255 characters',

  // Rows
  ROW_NOT_FOUND: 'Row not found',
  ROW_ID_REQUIRED: 'Row ID is required',
  INVALID_ROW_ID: 'Row ID must be a valid UUID',
  ROW_IDS_REQUIRED: 'Row IDs are required',
  ROW_IDS_EMPTY: 'At least one row ID is required',
  INVALID_ROW_IDS: 'All row IDs must be valid UUIDs',

  // Cells
  CELL_NOT_FOUND: 'Cell not found',
  CELL_VALUE_TOO_LONG: 'Cell value cannot exceed 5000 characters',

  // API Keys
  API_KEY_NOT_FOUND: 'API key not found',
  API_KEY_ID_REQUIRED: 'API key ID is required',
  API_KEY_ID_INVALID: 'API key ID must be a valid UUID',
};

export default {
  HTTP_STATUS,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
};
