import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import * as bcrypt from 'bcrypt';

@Entity('wayforpay')
export class WayforpayEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  merchantAccount: string;

  @Column()
  merchantSecret: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @OneToOne(() => UserEntity, (user) => user.payInfo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @BeforeInsert()
  async hashSecret() {
    if (this.merchantSecret != null) {
      this.merchantSecret = await bcrypt.hash(this.merchantSecret, 10);
    }
  }

  async compareSecret(merchantSecret: string): Promise<boolean> {
    return await bcrypt.compare(merchantSecret, this.merchantSecret);
  }
}
