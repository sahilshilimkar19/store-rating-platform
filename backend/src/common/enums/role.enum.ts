/**
 * Application user roles. The string values are persisted in the database
 * (Postgres enum) and embedded in the JWT payload, so they must stay stable.
 */
export enum Role {
  ADMIN = 'admin',
  NORMAL = 'normal',
  STORE_OWNER = 'store_owner',
}
