import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode, errorCodeForStatus } from '../enums/error-code.enum';

interface StandardErrorResponse {
  statusCode: number;
  error: string;
  /** Stable, machine-readable error code (e.g. RESOURCE_NOT_FOUND). */
  code: ErrorCode;
  /** A single message or a list of validation messages. */
  message: string | string[];
  path: string;
  timestamp: string;
}

/** Standard reason phrase for the common HTTP status codes we emit. */
function statusText(status: number): string {
  const map: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
  };
  return map[status] ?? 'Error';
}

/**
 * Global filter that normalizes every error into one consistent JSON shape:
 *   { statusCode, error, code, message, path, timestamp }
 *
 * - HttpExceptions (including class-validator failures from ValidationPipe)
 *   keep their status and messages.
 * - Anything else becomes a 500 with a generic message (details are logged,
 *   never returned to the client).
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = statusText(status);

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      // Default the human-readable label from the status; a structured response
      // body (e.g. class-validator's) may override it below.
      error = statusText(status);
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const body = res as Record<string, unknown>;
        message = (body.message as string | string[]) ?? exception.message;
        if (typeof body.error === 'string') {
          error = body.error;
        }
      }
    } else {
      // Unexpected error: log the full detail server-side, hide it from clients.
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const payload: StandardErrorResponse = {
      statusCode: status,
      error,
      code: errorCodeForStatus(status),
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(payload);
  }
}
