import { UserService } from '../user.service';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from '../../../entitties/user.entity';

describe('UserService', () => {
  let service: UserService;

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
        UserService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should send all users', async () => {
      const usersRepository = jest
        .spyOn(mockRepository, 'find')
        .mockResolvedValue({});

      const result = await service.findAll();

      expect(usersRepository).toBeCalled();
      expect(result).toEqual({});
    });
  });

  describe('getById', () => {
    it('should send the user', async () => {
      const uuid = 'user-uuid';
      const user = {
        email: 'user-email@email.com',
        password: 'password',
      };

      const resUser = {
        email: 'user-email@email.com',
      };

      const usersRepository = jest
        .spyOn(mockRepository, 'findOneBy')
        .mockResolvedValue(user);

      const result = await service.getById(uuid);

      expect(usersRepository).toHaveBeenCalledWith({ uuid });
      expect(result).toEqual(resUser);
    });
  });

  describe('updateUser', () => {
    it('should send updated user', async () => {
      const uuid = 'user-uuid';
      const data: Partial<UserEntity> = {
        email: 'update-user-email@email.com',
        password: 'update-password',
      };

      const usersRepository = jest
        .spyOn(mockRepository, 'update')
        .mockResolvedValue({});

      const updatedUser = jest
        .spyOn(mockRepository, 'findOneBy')
        .mockResolvedValue(data);

      const result = await service.updateUser(uuid, data as UserEntity);

      expect(result).toEqual(data);
      expect(usersRepository).toHaveBeenCalledWith(
        { uuid },
        data as UserEntity,
      );
      expect(updatedUser).toHaveBeenCalledWith({ uuid });
    });
  });
});
