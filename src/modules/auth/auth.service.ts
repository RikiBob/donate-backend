import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '../../entitties/user.entity';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CreateUserDto } from './dtos/create-user.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { GoogleProfileDto } from './dtos/google-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async checkAndCreateForUser(data: CreateUserDto): Promise<string> {
    if (data.password !== data.repeatPassword) {
      throw new BadRequestException('Invalid repeat password');
    }

    let user = await this.usersRepository.findOneBy({ email: data.email });
    if (user) {
      throw new BadRequestException('This email is already in use');
    }

    if (user) {
    } else {
      user = this.usersRepository.create({
        ...data,
      });
      await this.usersRepository.save(user);

      return user.uuid;
    }
  }

  async generateJwt(
    payload: JwtPayload,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenPair = {
      accessToken: this.jwtService.sign(payload, {
        secret: 'www',
        expiresIn: '30m',
      }),
      refreshToken: this.jwtService.sign(payload, {
        secret: 'www',
        expiresIn: '85h',
      }),
    };

    await this.cacheManager.set(
      'refresh_token',
      tokenPair.refreshToken,
      2592000,
    );

    return tokenPair;
  }

  async signIn(
    user: any,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    if (!user) {
      throw new BadRequestException('Unauthenticated');
    }

    const userExists = await this.checkByEmail(user.email);
    if (!userExists) {
      return this.checkAndCreate(user);
    }

    return this.generateJwt({
      sub: userExists.uuid,
      email: userExists.email,
    });
  }

  async checkByEmail(email: string): Promise<UserEntity> {
    const user = this.usersRepository.findOneBy({ email });
    if (!user) {
      return null;
    }

    return user;
  }

  async login(email: string, password: string): Promise<UserEntity> {
    const existingUser = await this.checkByEmail(email);
    const isPasswordValid = await existingUser.comparePassword(password);
    if (!existingUser || !isPasswordValid) {
      throw new BadRequestException('Invalid email or password');
    }

    return existingUser;
  }

  async logout() {
    await this.cacheManager.del('refresh_token');
  }

  async findById(uuid: string): Promise<UserEntity> {
    return await this.usersRepository.findOneBy({ uuid });
  }

  async checkAndCreate(
    data: GoogleProfileDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let user = await this.usersRepository.findOneBy({ email: data.email });

    if (!user) {
      user = await this.usersRepository.save(data);
    }

    return this.generateJwt({
      sub: user.uuid,
      email: user.email,
    });
  }
}
