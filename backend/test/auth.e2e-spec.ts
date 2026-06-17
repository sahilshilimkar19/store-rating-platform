import { randomUUID } from 'crypto';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { DataType, newDb } from 'pg-mem';
import request from 'supertest';
import { DataSource } from 'typeorm';

// Satisfy the Joi env validation in AppModule before it is imported/compiled.
// The TypeORM DataSource is overridden with pg-mem below, so DATABASE_URL is
// only present to pass validation — it is never actually connected to.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'e2e-test-secret-please-do-not-use-in-prod';
process.env.DATABASE_URL ??= 'postgres://unused@localhost:5432/unused';

// Imported after the env is set so ConfigModule validation passes.
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { InitialSchema1781519143839 } from '../src/database/migrations/1781519143839-InitialSchema';
import { Rating } from '../src/ratings/entities/rating.entity';
import { Store } from '../src/stores/entities/store.entity';
import { User } from '../src/users/entities/user.entity';

/**
 * An in-memory Postgres (pg-mem) wired to a TypeORM DataSource, so the e2e is
 * hermetic — no external database is required. We register the few server
 * functions our schema relies on (uuid-ossp, version, current_database), then
 * build the schema from the real production migration rather than TypeORM's
 * `synchronize` (whose catalog introspection isn't supported by pg-mem).
 */
async function buildInMemoryDataSource(): Promise<DataSource> {
  const db = newDb({ autoCreateForeignKeyIndices: true });

  db.public.registerFunction({
    name: 'version',
    returns: DataType.text,
    implementation: () => 'PostgreSQL 14.0 (pg-mem)',
  });
  db.public.registerFunction({
    name: 'current_database',
    returns: DataType.text,
    implementation: () => 'test',
  });
  db.registerExtension('uuid-ossp', (schema) => {
    schema.registerFunction({
      name: 'uuid_generate_v4',
      returns: DataType.uuid,
      implementation: () => randomUUID(),
      impure: true,
    });
  });

  const dataSource: DataSource = db.adapters.createTypeormDataSource({
    type: 'postgres',
    entities: [User, Store, Rating],
    synchronize: false,
  });
  await dataSource.initialize();

  // Apply the actual migration DDL (plain CREATE statements — no introspection).
  const queryRunner = dataSource.createQueryRunner();
  await new InitialSchema1781519143839().up(queryRunner);
  await queryRunner.release();

  return dataSource;
}

describe('Auth & RBAC (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const normalUser = {
    name: 'Normal Platform User Account',
    email: 'normal.e2e@example.com',
    password: 'Password@1',
    address: '1 Test Street',
  };

  beforeAll(async () => {
    dataSource = await buildInMemoryDataSource();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(getDataSourceToken())
      .useValue(dataSource)
      .compile();

    app = moduleRef.createNestApplication();
    // Mirror the global pipeline from src/main.ts so validation and the error
    // shape under test match production behavior.
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    // app.close() already tears down the TypeORM DataSource (Nest manages it as
    // the provided connection); only destroy directly if it is still open.
    await app?.close();
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  it('GET /health is public and reports liveness', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body).toHaveProperty('status');
  });

  it('POST /auth/register creates a normal user', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send(normalUser)
      .expect(201);

    expect(res.body.user).toMatchObject({
      email: normalUser.email,
      role: 'normal',
    });
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('POST /auth/register rejects an invalid name with the standard error shape', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ ...normalUser, email: 'short.name@example.com', name: 'Too Short' })
      .expect(400);

    expect(res.body).toMatchObject({
      statusCode: 400,
      code: expect.any(String),
      path: '/auth/register',
    });
    expect(Array.isArray(res.body.message)).toBe(true);
  });

  it('POST /auth/login returns an access token for valid credentials', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: normalUser.email, password: normalUser.password })
      .expect(200);

    expect(typeof res.body.accessToken).toBe('string');
    expect(res.body.user.role).toBe('normal');
  });

  it('POST /auth/login rejects a wrong password with 401', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: normalUser.email, password: 'WrongPass@1' })
      .expect(401);
  });

  it('GET /users is forbidden (403) for a normal user', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: normalUser.email, password: normalUser.password })
      .expect(200);

    await request(app.getHttpServer())
      .get('/users')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(403);
  });

  it('GET /users is unauthorized (401) without a token', async () => {
    await request(app.getHttpServer()).get('/users').expect(401);
  });
});
