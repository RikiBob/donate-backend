import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { Cache } from 'cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from '../../../entitties/user.entity';
import { ConfigModule } from '@nestjs/config';
import { CreateUserDto } from '../dtos/create-user.dto';
import { Response } from 'express';
import { LoginUserDto } from '../dtos/login-user.dto';
import { HttpStatus } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;
  let cacheManager: Cache;

  const mockRepository = {
    find: jest.fn(),
    create: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      controllers: [AuthController],
      providers: [
        AuthService,
        JwtService,
        {
          provide: CACHE_MANAGER,
          useValue: {
            del: jest.fn(),
            get: jest.fn(),
            set: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createUser', () => {
    it('should send a new user id', async () => {
      const data: Partial<CreateUserDto> = {
        email: 'email@example.com',
        password: 'password',
      };
      const res: Partial<Response> = {
        cookie: jest.fn(),
        send: jest.fn(),
      };
      const newUserId = 'user-uuid';

      jest.spyOn(service, 'checkAndCreateForUser').mockResolvedValue(newUserId);
      jest.spyOn(service, 'signIn').mockResolvedValue({
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      });
      jest.spyOn(cacheManager, 'get');
      jest.spyOn(cacheManager, 'del');
      jest.spyOn(res, 'cookie').mockReturnValue(res as Response);
      jest
        .spyOn(res, 'send')
        .mockReturnValue({ ...res, newUserId } as Response);

      const result = await controller.createUser(
        data as CreateUserDto,
        res as Response,
      );

      expect(cacheManager.get).toHaveBeenCalledWith('current-user');
      expect(cacheManager.del).toHaveBeenCalledWith('current-user');
      expect(service.checkAndCreateForUser).toHaveBeenCalledWith(data);
      expect(service.signIn).toHaveBeenCalledWith(data);
      expect(res.send).toHaveBeenCalledWith(newUserId);
      expect(result).toEqual({ ...res, newUserId });
    });
  });

  describe('login', () => {
    it('should send user id', async () => {
      const data: LoginUserDto = {
        email: 'email@example.com',
        password: 'password',
      };
      const res: Partial<Response> = {
        cookie: jest.fn(),
        send: jest.fn(),
      };
      const user = {
        uuid: 'user-uuid',
      };

      jest
        .spyOn(service, 'login')
        .mockResolvedValue({ uuid: 'user-uuid' } as UserEntity);
      jest.spyOn(service, 'signIn').mockResolvedValue({
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      });
      jest.spyOn(res, 'cookie');
      jest.spyOn(res, 'send').mockReturnValue({ ...res, ...user } as Response);

      const result = await controller.login(data, res as Response);

      expect(service.login).toHaveBeenCalledWith(data.email, data.password);
      expect(service.signIn).toHaveBeenCalledWith({ uuid: 'user-uuid' });
      expect(res.send).toHaveBeenCalledWith(user.uuid);
      expect(result).toEqual({ ...res, ...user });
    });
  });

  describe('logout', () => {
    it('should send status Ok', async () => {
      const res: Partial<Response> = {
        clearCookie: jest.fn(),
        sendStatus: jest.fn(),
      };

      jest.spyOn(service, 'logout');
      jest.spyOn(res, 'clearCookie');
      jest.spyOn(res, 'sendStatus');

      await controller.logout(res as Response);

      expect(service.logout).toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledWith('access_token');
      expect(res.clearCookie).toHaveBeenCalledWith('refresh_token');
      expect(res.sendStatus).toHaveBeenCalledWith(HttpStatus.OK);
    });
  });

  describe('googleRedirect', () => {
    it('should send redirect', async () => {
      const req = {
        user: {
          email: 'email@example.com',
        },
      };
      const res: Partial<Response> = {
        send: jest.fn(),
        redirect: jest.fn(),
        cookie: jest.fn(),
      };

      jest.spyOn(service, 'checkByEmail').mockResolvedValue(null);
      jest.spyOn(cacheManager, 'set');
      jest.spyOn(res, 'redirect');

      await controller.googleRedirect(req, res as Response);

      expect(service.checkByEmail).toHaveBeenCalledWith(req.user.email);
      expect(cacheManager.set).toHaveBeenCalledWith('current-user', req.user);
      expect(res.redirect).toHaveBeenCalledWith(process.env.REDIRECT_URL);
    });

    it('should send user id', async () => {
      const req = {
        user: {
          email: 'email@example.com',
        },
      };
      const res: Partial<Response> = {
        send: jest.fn(),
        redirect: jest.fn(),
        cookie: jest.fn(),
      };
      const user = {
        uuid: 'user-uuid',
      };

      jest.spyOn(service, 'checkByEmail').mockResolvedValue(user as UserEntity);
      jest.spyOn(service, 'signIn').mockResolvedValue({
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      });
      jest.spyOn(res, 'cookie');
      jest.spyOn(res, 'send').mockReturnValue({ ...res, ...user } as Response);

      const result = await controller.googleRedirect(req, res as Response);

      expect(service.checkByEmail).toHaveBeenCalledWith(req.user.email);
      expect(service.signIn).toHaveBeenCalledWith(req.user);
      expect(res.cookie).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith(user.uuid);
      expect(result).toEqual({ ...res, ...user });
    });
  });
});
