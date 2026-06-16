import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StoresModule } from './stores/stores.module';
import { RatingsModule } from './ratings/ratings.module';
import { AdminModule } from './admin/admin.module';
import { HealthController } from './common/health.controller';
import { User } from './users/entities/user.entity';
import { Store } from './stores/entities/store.entity';
import { Rating } from './ratings/entities/rating.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Fail fast at boot if the environment is misconfigured. Either a single
      // DATABASE_URL or the full set of discrete DB_* variables must be present.
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRY: Joi.string().default('1d'),
        CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
        DATABASE_URL: Joi.string(),
        DB_HOST: Joi.string(),
        DB_PORT: Joi.number(),
        DB_USERNAME: Joi.string(),
        DB_PASSWORD: Joi.string().allow(''),
        DB_NAME: Joi.string(),
      })
        .or('DATABASE_URL', 'DB_HOST')
        .with('DB_HOST', ['DB_USERNAME', 'DB_NAME']),
      validationOptions: { abortEarly: false },
    }),
    // Global rate limit: 60 requests/minute/IP (overridden per-route via @Throttle).
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('DATABASE_URL');
        // Prefer a single DATABASE_URL connection string; otherwise fall back
        // to the discrete DB_* variables.
        const connection = url
          ? { url }
          : {
              host: config.get<string>('DB_HOST', 'localhost'),
              port: config.get<number>('DB_PORT', 5432),
              username: config.get<string>('DB_USERNAME'),
              password: config.get<string>('DB_PASSWORD'),
              database: config.get<string>('DB_NAME'),
            };
        return {
          type: 'postgres' as const,
          ...connection,
          entities: [User, Store, Rating],
          // Schema is managed via migrations; never auto-sync.
          synchronize: false,
        };
      },
    }),
    AuthModule,
    UsersModule,
    StoresModule,
    RatingsModule,
    AdminModule,
  ],
  controllers: [HealthController],
  providers: [
    // Apply the rate limiter globally; 429s are normalized by HttpExceptionFilter.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // Authenticate every route by default; @Public() opts a route out. Runs
    // before the per-controller RolesGuard, which reads the populated req.user.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Structured request/response logging.
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
