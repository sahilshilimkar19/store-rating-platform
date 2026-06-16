/**
 * Stable, machine-readable error codes returned in every error response under
 * `error.code`. Clients can branch on these instead of parsing human-readable
 * messages or hard-coding HTTP status numbers. Values are part of the API
 * contract, so keep them stable.
 */
export enum ErrorCode {
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  RATE_LIMITED = 'RATE_LIMITED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

/** Maps an HTTP status code to its semantic ErrorCode. */
export function errorCodeForStatus(status: number): ErrorCode {
  switch (status) {
    case 400:
    case 422:
      return ErrorCode.VALIDATION_FAILED;
    case 401:
      return ErrorCode.UNAUTHORIZED;
    case 403:
      return ErrorCode.FORBIDDEN;
    case 404:
      return ErrorCode.RESOURCE_NOT_FOUND;
    case 409:
      return ErrorCode.DUPLICATE_ENTRY;
    case 429:
      return ErrorCode.RATE_LIMITED;
    default:
      return ErrorCode.INTERNAL_ERROR;
  }
}
