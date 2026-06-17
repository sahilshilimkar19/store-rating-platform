import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuthenticatedUser } from '../../auth/interfaces/jwt-payload.interface';

/**
 * Logs one line when a request arrives and one when it completes, including the
 * resolved status code and elapsed time. Authenticated requests are attributed
 * to their user id; everything else is logged as ANON.
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request & { user?: AuthenticatedUser }>();
    const res = http.getResponse<Response>();
    const { method, originalUrl } = req;
    const start = Date.now();

    const actor = req.user?.userId ?? 'ANON';
    this.logger.log(`${method} ${originalUrl} — called by ${actor}`);

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start;
        this.logger.log(
          `${method} ${originalUrl} — ${res.statusCode} — ${ms}ms`,
        );
      }),
    );
  }
}
