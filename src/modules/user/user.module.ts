import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../entitties/user.entity';
import { JwtService } from '@nestjs/jwt';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { AuthModule } from '../auth/auth.module';
import { PostEntity } from '../../entitties/post.entity';
import { WayforpayEntity } from '../../entitties/wayforpay.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, PostEntity, WayforpayEntity]),
    AuthModule,
  ],
  controllers: [UserController],
  providers: [UserService, JwtService, JwtStrategy],
})
export class UserModule {}
