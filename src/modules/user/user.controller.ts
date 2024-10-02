import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserProfileDto } from './dtos/user-profile.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { JwtAuthGuard } from '../../guards/jwt.auth.guard';
import { RequestWithUser, ReqUser } from '../auth/strategies/jwt.strategy';
import { UserEntity } from '../../entitties/user.entity';

@Controller('user')
export class UserController {
  constructor(private readonly usersService: UserService) {}

  @Get('all')
  async findAll(): Promise<UserEntity[]> {
    return await this.usersService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getById(
    @Req() req: RequestWithUser,
    @Query('uuid') uuid?: string,
  ): Promise<UserProfileDto> {
    const userId = uuid ? uuid : (req.user as ReqUser).uuid;
    return await this.usersService.getById(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  updateUser(
    @Param('id') uuid: string,
    @Body() data: UpdateUserDto,
  ): Promise<UserProfileDto> {
    return this.usersService.updateUser(uuid, data);
  }
}
