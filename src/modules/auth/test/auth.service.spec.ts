import { AuthService } from '../auth.service';
import { JwtService } from '@nestjs/jwt';
import { Cache } from 'cache-manager';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from '../../../entitties/user.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CreateUserDto } from '../dtos/create-user.dto';
import { BadRequestException } from '@nestjs/common';
import { LoginUserDto } from '../dtos/login-user.dto';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;
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
      providers: [
        AuthService,
        JwtService,
        {
          provide: CACHE_MANAGER,
          useValue: {
            del: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkAndCreateForUser', () => {
    it('should send user id', async () => {
      const data: Partial<CreateUserDto> = {
        password: 'password',
        repeatPassword: 'password',
        email: 'email@example.com',
      };
      const userId = 'user-uuid';

      jest.spyOn(mockRepository, 'findOneBy').mockResolvedValue(null);
      jest
        .spyOn(mockRepository, 'create')
        .mockReturnValue({ ...data, uuid: userId });
      jest
        .spyOn(mockRepository, 'save')
        .mockResolvedValue({ ...data, uuid: userId });

      const result = await service.checkAndCreateForUser(data as CreateUserDto);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        email: 'email@example.com',
      });
      expect(mockRepository.create).toHaveBeenCalledWith({ ...data });
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...data,
        uuid: userId,
      });
      expect(result).toEqual(userId);
    });

    it('should throw BadRequestException Invalid repeat password', async () => {
      const data: Partial<CreateUserDto> = {
        password: 'password',
        repeatPassword: 'repeatPassword',
        email: 'email@example.com',
      };

      await expect(
        service.checkAndCreateForUser(data as CreateUserDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException This email is already in use', async () => {
      const data: Partial<CreateUserDto> = {
        password: 'password',
        repeatPassword: 'password',
        email: 'email@example.com',
      };

      jest.spyOn(mockRepository, 'findOneBy').mockResolvedValue(data.email);

      await expect(
        service.checkAndCreateForUser(data as CreateUserDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('signIn', () => {
    it('should send token pair', async () => {
      const user: LoginUserDto = {
        email: 'email@example.com',
        password: 'password',
      };
      const tokenPair = {
        accessToken: 'accessToken',
        refreshToken: 'refreshToken',
      };
      const mockUser: Partial<UserEntity> = {
        email: 'email@example.com',
        password: 'hashedPassword',
        comparePassword: jest.fn(),
      };

      jest.spyOn(mockRepository, 'findOneBy').mockResolvedValue(mockUser);
      jest.spyOn<any, any>(service, 'generateJwt').mockResolvedValue(tokenPair);

      const result = await service.signIn(user as LoginUserDto);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        email: user.email,
      });
      expect(result).toEqual(tokenPair);
    });

    it('should throw BadRequestException Unauthenticated', async () => {
      const user: LoginUserDto = {
        email: 'email@example.com',
        password: 'password',
      };

      jest.spyOn(mockRepository, 'findOneBy').mockResolvedValue(null);

      await expect(service.signIn(user as LoginUserDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('checkByEmail', () => {
    it('should send user', async () => {
      const email = 'email@example.com';
      const mockUser: Partial<UserEntity> = {
        email: 'email@example.com',
        password: 'hashedPassword',
        comparePassword: jest.fn(),
      };

      jest.spyOn(mockRepository, 'findOneBy').mockResolvedValue(mockUser);

      const result = await service.checkByEmail(email);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ email });
      expect(result).toEqual(mockUser);
    });

    it('should send null', async () => {
      const email = 'email@example.com';

      jest.spyOn(mockRepository, 'findOneBy').mockResolvedValue(null);

      const result = await service.checkByEmail(email);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ email });
      expect(result).toEqual(null);
    });
  });

  describe('login', () => {
    it('should send user', async () => {
      const email = 'email@example.com';
      const password = 'password';
      const mockUser: Partial<UserEntity> = {
        email: 'email@example.com',
        password: 'hashedPassword',
        comparePassword: jest.fn(),
      };

      jest
        .spyOn(service, 'checkByEmail')
        .mockResolvedValue(mockUser as UserEntity);
      jest.spyOn(mockUser, 'comparePassword').mockResolvedValue(true);

      const result = await service.login(email, password);

      expect(service.checkByEmail).toHaveBeenCalledWith(email);
      expect(mockUser.comparePassword).toHaveBeenCalledWith(password);
      expect(result).toEqual(mockUser);
    });

    it('should throw BadRequestException Invalid email or password', async () => {
      const email = 'email@example.com';
      const password = 'password';
      const mockUser: Partial<UserEntity> = {
        email: 'email@example.com',
        password: 'hashedPassword',
        comparePassword: jest.fn(),
      };

      jest
        .spyOn(service, 'checkByEmail')
        .mockResolvedValue(mockUser as UserEntity);
      jest.spyOn(mockUser, 'comparePassword').mockResolvedValue(false);

      await expect(service.login(email, password)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('logout', () => {
    it('should delete token from the cache', async () => {
      jest.spyOn(cacheManager, 'del');

      await service.logout();

      expect(cacheManager.del).toHaveBeenCalledWith('refresh_token');
    });
  });

  describe('findById', () => {
    it('should send user id', async () => {
      const userId = 'user-uuid';

      jest.spyOn(mockRepository, 'findOneBy').mockResolvedValue({});

      const result = await service.findById(userId);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ uuid: userId });
      expect(result).toEqual({});
    });
  });
});
