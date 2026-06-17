import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // Secure HTTP headers (noSniff, frameguard, hidePoweredBy, HSTS, …).
  // CSP is left disabled: this process only serves JSON, and a strict CSP here
  // would have no document to protect while risking blocking the Swagger UI.
  app.use(helmet({ contentSecurityPolicy: false }));

  // Strip unknown properties, reject extras, and transform payloads to DTO types.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // One consistent error response shape across the whole API.
  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors({
    origin: config
      .get<string>('CORS_ORIGIN', 'http://localhost:5173')
      .split(','),
    credentials: true,
  });

  // Interactive API docs at /api/docs — exposed outside production only.
  if (config.get<string>('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Store Rating Platform API')
      .setDescription(
        'REST API for the Store Rating Platform. Authenticate via POST /auth/login, ' +
          'then click "Authorize" and paste the accessToken to call protected routes.',
      )
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .addTag('Auth', 'Registration, login, and password management')
      .addTag('Users', 'Admin user management')
      .addTag('Stores', 'Store listings and creation')
      .addTag('Ratings', 'Submitting and updating ratings')
      .addTag('Store Owner', 'Store owner dashboard')
      .addTag('Admin', 'Platform statistics and analytics')
      .addTag('Health', 'Liveness probe')
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);
}

void bootstrap();
