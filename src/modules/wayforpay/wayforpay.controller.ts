import {
  Body,
  Controller,
  Delete,
  Param,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
  HttpException,
} from '@nestjs/common';
import { WayforpayService } from './wayforpay.service';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../../guards/jwt.auth.guard';
import { SaveWayForPayDto } from './dtos/save-wayforpay.dto';
import { RequestWithUser } from '../auth/strategies/jwt.strategy';

@Controller('wayforpay')
export class WayforpayController {
  constructor(
    private readonly wayforpayService: WayforpayService,
    private readonly configService: ConfigService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async sendPaymentRequest(
    @Req() req: RequestWithUser,
    @Res() res: Response,
    @Body() data: any,
  ): Promise<void | string> {
    try {
      await this.wayforpayService.checkInfoPayAndCreate(req.user.uuid);
      const response = await this.wayforpayService.sendPaymentRequest(data);
      const URL = response.request.res.responseUrl;
      res.status(HttpStatus.OK).json({ redirectURL: URL });
    } catch (error) {
      throw new HttpException(
        'Failed to send payment request',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('successful')
  successfulPaymentRedirect(@Res() res: Response): void {
    const url = this.configService.get('WAYFORPAY_APPROVED_REDIRECT_URL');
    res.redirect(url);
  }

  @Post('unsuccessful')
  unsuccessfulPaymentRedirect(@Res() res: Response): void {
    const url = this.configService.get('WAYFORPAY_DECLINED_REDIRECT_URL');
    res.redirect(url);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/setting_up_details')
  async saveWayforpayUser(
    @Body() data: SaveWayForPayDto,
    @Req() req: RequestWithUser,
  ): Promise<string> {
    return await this.wayforpayService.saveWayforpayUser(data, req);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':user_id')
  async deleteInfoPay(
    @Param('user_id') userId: string,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    await this.wayforpayService.deleteInfoPay(userId, req.user.uuid);
  }
}
