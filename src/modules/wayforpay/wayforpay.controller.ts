import { Body, Controller, HttpStatus, Post, Res } from '@nestjs/common';
import { WayforpayService } from './wayforpay.service';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('wayforpay')
export class WayforpayController {
  constructor(
    private readonly wayforpayService: WayforpayService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  async sendPaymentRequest(
    @Res() res: Response,
    @Body() data: any,
  ): Promise<void | string> {
    try {
      const response = await this.wayforpayService.sendPaymentRequest(data);
      const URL = response.request.res.responseUrl;
      res.status(HttpStatus.OK).json({ redirectURL: URL });
    } catch (error) {
      throw new Error('Failed to send payment request');
    }
  }

  @Post('successful')
  successfulPaymentRedirect(@Res() res: Response) {
    const url = this.configService.get('WAYFORPAY_APPROVED_REDIRECT_URL');
    res.redirect(url);
  }

  @Post('unsuccessful')
  unsuccessfulPaymentRedirect(@Res() res: Response) {
    const url = this.configService.get('WAYFORPAY_DECLINED_REDIRECT_URL');
    res.redirect(url);
  }
}
