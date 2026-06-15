import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Store } from '../../stores/entities/store.entity';
import { User } from '../../users/entities/user.entity';

/**
 * A single user's rating (1-5) for a single store.
 * - One rating per (user, store) pair, enforced by the unique constraint.
 * - The value is bounded both at the DB level (CHECK) and in the DTO.
 */
@Entity('ratings')
@Unique('UQ_ratings_user_store', ['user', 'store'])
@Check('CHK_ratings_value', '"value" >= 1 AND "value" <= 5')
export class Rating extends BaseEntity {
  @Column({ type: 'int' })
  value: number;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Store, (store) => store.ratings, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'store_id' })
  store: Store;
}
