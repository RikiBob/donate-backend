import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { CreateUserDto } from './dtos/create-user.dto';
import { LoginUserDto } from './dtos/login-user.dto';
import { LocalAuthGuard } from './guards/local.auth.guard';
import { GoogleAuthGuard } from './guards/google.auth';
import { ConfigService } from '@nestjs/config';
import { CustomRequest } from './strategies/jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  currentUser;

  @Post('user')
  async createUser(
    @Body() data: CreateUserDto,
    @Res() res: Response,
  ): Promise<Response> {
    const newUserId = await this.authService.checkAndCreateForUser(data);
    const { accessToken, refreshToken } = await this.authService.signIn(data);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      maxAge: 60 * 30 * 1000,
      sameSite: true,
      secure: false,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      maxAge: 2592000000,
      sameSite: true,
      secure: false,
    });

    return res.send(newUserId);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Body() data: LoginUserDto,
    @Res() res: Response,
  ): Promise<Response> {
    const user = await this.authService.login(data.email, data.password);

    const { accessToken, refreshToken } = await this.authService.signIn(user);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      maxAge: 60 * 30 * 1000,
      sameSite: true,
      secure: true,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      maxAge: 2592000000,
      sameSite: true,
      secure: false,
    });

    return res.send(user.uuid);
  }
  @Post('logout')
  async logout(@Res() res: Response) {
    await this.authService.logout();
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    res.sendStatus(HttpStatus.OK);
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google')
  async googleAuth() {}

  @UseGuards(GoogleAuthGuard)
  @Get('google/redirect')
  async googleRedirect(@Req() req: CustomRequest, @Res() res: Response) {
    const { accessToken, refreshToken } = await this.authService.signIn(
      req.user,
    );
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      maxAge: 60 * 30 * 1000,
      sameSite: true,
      secure: false,
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      maxAge: 2592000000,
      sameSite: true,
      secure: false,
    });

    this.currentUser = req.user;

    return res.redirect(this.configService.get('REDIRECT_URL'));
  }
}
