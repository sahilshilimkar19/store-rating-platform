import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Store } from '../stores/entities/store.entity';
import { Rating } from '../ratings/entities/rating.entity';

// Standalone DataSource used by the TypeORM CLI (migration:generate/run/revert).
// The running app configures TypeORM separately via TypeOrmModule.forRootAsync.
loadEnv();

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [User, Store, Rating],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
