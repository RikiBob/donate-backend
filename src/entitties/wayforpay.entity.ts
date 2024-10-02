import {
  BeforeInsert,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';
import * as crypto from 'node:crypto';
import { config } from 'dotenv';

config();

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
  encrypt() {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(process.env.ENCRYPT_KEY),
      iv,
    );
    let encrypted = cipher.update(this.merchantSecret, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    this.merchantSecret = iv.toString('hex') + ':' + encrypted;
  }

  decrypt(encryptedText: string) {
    const textParts = encryptedText.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedTextBuffer = Buffer.from(textParts.join(':'), 'hex');

    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(process.env.ENCRYPT_KEY),
      iv,
    );
    let decrypted = decipher.update(encryptedTextBuffer, null, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
