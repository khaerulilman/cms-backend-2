export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

export const ERROR_MESSAGES = {
  // Auth errors
  USER_NOT_FOUND: "User not found",
  INVALID_CREDENTIALS: "Invalid email or password",
  USER_ALREADY_EXISTS:
    "Email already exists. Please use a different email or login instead",
  INVALID_TOKEN: "Invalid or expired token",
  NO_TOKEN_PROVIDED: "No token provided",
  INVALID_REFRESH_TOKEN: "Invalid refresh token",
  TOKEN_REVOKED: "Token has been revoked",
  REFRESH_TOKEN_EXPIRED: "Refresh token has expired",
  REFRESH_TOKEN_EXPIRED_TESTTTT: "Refresh token has expired",

  // Validation errors
  EMAIL_REQUIRED: "Email is required",
  PASSWORD_REQUIRED: "Password is required",
  NAME_REQUIRED: "Name is required",
  EMAIL_INVALID: "Invalid email format",
  PASSWORD_WEAK: "Password must be at least 8 characters long",
  NAME_TOO_SHORT: "Name must be at least 2 characters",
  NAME_TOO_LONG: "Name must not exceed 100 characters",
  VALIDATION_ERROR: "Validation error",

  // API Key errors
  API_KEY_NOT_FOUND: "API key not found",
  API_KEY_ID_REQUIRED: "API key ID is required",
  API_KEY_ID_INVALID: "API key ID must be a valid UUID",

  // Column errors
  TABLE_ID_REQUIRED: "Table ID is required",
  INVALID_TABLE_ID: "Table ID must be a valid UUID",
  COLUMNS_REQUIRED: "Columns array is required",
  COLUMNS_EMPTY: "At least one column is required",
  COLUMN_NAME_REQUIRED: "Column name is required",
  COLUMN_NAME_EMPTY: "Column name cannot be empty",
  COLUMN_NAME_TOO_LONG: "Column name cannot exceed 255 characters",
  COLUMN_NOT_FOUND: "Column not found",
  TABLE_NOT_FOUND: "Table not found",
  ROW_NOT_FOUND: "Row not found",

  // Cell errors
  CELL_NOT_FOUND: "Cell not found",
  ROW_ID_REQUIRED: "Row ID is required",
  INVALID_ROW_ID: "Row ID must be a valid UUID",
  COLUMN_ID_REQUIRED: "Column ID is required",
  INVALID_COLUMN_ID: "Column ID must be a valid UUID",
  CELL_ID_REQUIRED: "Cell ID is required",
  INVALID_CELL_ID: "Cell ID must be a valid UUID",
  CELL_VALUE_TOO_LONG: "Cell value cannot exceed 5000 characters",
  CELL_VALUE_OR_IMAGE_REQUIRED: "Either cell value or image is required",

  // Bulk row errors
  ROW_IDS_REQUIRED: "Row IDs array is required",
  ROW_IDS_EMPTY: "At least one row ID is required",
  INVALID_ROW_IDS: "All row IDs must be valid UUIDs",

  // Server errors
  DATABASE_ERROR: "Database error",
  INTERNAL_SERVER_ERROR: "Internal server error",
  UNAUTHORIZED: "Unauthorized",
  FORBIDDEN: "Forbidden",
  NOT_FOUND: "Resource not found",
};

export const SUCCESS_MESSAGES = {
  USER_REGISTERED: "User registered successfully",
  LOGIN_SUCCESS: "Login successful",
  LOGOUT_SUCCESS: "Logout successful",
  LOGOUT_ALL_SUCCESS: "Logged out from all devices successfully",
  PROFILE_RETRIEVED: "Profile retrieved successfully",
  TOKEN_REFRESHED: "Token refreshed successfully",
  SESSIONS_RETRIEVED: "Active sessions retrieved successfully",

  // API Key messages
  API_KEY_GENERATED: "API key generated successfully",
  API_KEYS_RETRIEVED: "API keys retrieved successfully",
  API_KEY_DELETED: "API key deleted successfully",

  // Project messages
  PROJECT_CREATED: "Project created successfully",
  PROJECT_RETRIEVED: "Project retrieved successfully",
  PROJECTS_RETRIEVED: "Projects retrieved successfully",
  PROJECT_UPDATED: "Project updated successfully",
  PROJECT_DELETED: "Project deleted successfully",

  // Column messages
  COLUMNS_CREATED: "Columns created successfully",
  COLUMNS_RETRIEVED: "Columns retrieved successfully",
  COLUMN_RETRIEVED: "Column retrieved successfully",
  COLUMN_UPDATED: "Column updated successfully",
  COLUMN_DELETED: "Column deleted successfully",

  // Row messages
  ROW_CREATED: "Row created successfully",
  ROWS_RETRIEVED: "Rows retrieved successfully",
  ROW_RETRIEVED: "Row retrieved successfully",
  ROW_UPDATED: "Row updated successfully",
  ROW_DELETED: "Row deleted successfully",
  ROWS_DELETED: "Rows deleted successfully",

  // Cell messages
  CELL_CREATED: "Cell created successfully",
  CELL_UPSERTED: "Cell upserted successfully",
  CELLS_RETRIEVED: "Cells retrieved successfully",
  CELL_RETRIEVED: "Cell retrieved successfully",
  CELL_UPDATED: "Cell updated successfully",
};

export default {
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
};
