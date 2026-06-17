import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Rating } from '../../ratings/entities/rating.entity';

@Entity('stores')
export class Store extends BaseEntity {
  @Column({ type: 'varchar', length: 60 })
  name: string;

  @Index('UQ_stores_email', { unique: true })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 400, nullable: true })
  address: string | null;

  /**
   * Owning user account. Nullable because a store may be registered before (or
   * without) an owner login existing. SET NULL keeps the store if the owner is
   * deleted. The owner_id column is defined by this relation's JoinColumn.
   */
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'owner_id' })
  owner: User | null;

  @OneToMany(() => Rating, (rating) => rating.store)
  ratings: Rating[];
}
