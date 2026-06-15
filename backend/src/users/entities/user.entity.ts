import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Role } from '../../common/enums/role.enum';

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 60 })
  name: string;

  @Index('UQ_users_email', { unique: true })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  /**
   * Bcrypt hash. Excluded from default selects so it is never leaked through
   * generic queries — must be explicitly re-selected (addSelect) when needed
   * for password verification.
   */
  @Column({ type: 'varchar', length: 255, select: false })
  password: string;

  @Column({ type: 'varchar', length: 400, nullable: true })
  address: string | null;

  @Column({ type: 'enum', enum: Role, default: Role.NORMAL })
  role: Role;
}
