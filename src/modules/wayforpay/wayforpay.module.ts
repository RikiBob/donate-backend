import { Module } from '@nestjs/common';
import { WayforpayService } from './wayforpay.service';
import { WayforpayController } from './wayforpay.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../../entitties/user.entity';
import { WayforpayEntity } from '../../entitties/wayforpay.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity, WayforpayEntity])],
  controllers: [WayforpayController],
  providers: [WayforpayService],
})
export class WayforpayModule {}
