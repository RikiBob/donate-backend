import { Module } from '@nestjs/common';
import { WayforpayService } from './wayforpay.service';
import { WayforpayController } from './wayforpay.controller';

@Module({
  controllers: [WayforpayController],
  providers: [WayforpayService],
})
export class WayforpayModule {}
