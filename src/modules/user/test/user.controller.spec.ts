import { UserController } from '../user.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from '../user.service';
import { UserEntity } from '../../../entitties/user.entity';
import { RequestWithUser } from '../../auth/strategies/jwt.strategy';

describe('UserController', () => {
  let controller: UserController;
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
      controllers: [UserController],
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  it('should be defined service', () => {
    expect(service).toBeDefined();
  });

  it('should be defined controller', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should send all users', async () => {
      const findAll = jest.spyOn(service, 'findAll').mockResolvedValue([]);
      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(findAll).toBeCalled();
    });
  });

  describe('getById', () => {
    it('should send the user', async () => {
      const req: Partial<RequestWithUser> = {
        user: {
          uuid: 'user-uuid',
        },
      };
      const uuid = 'user-uuid';

      const getById = jest
        .spyOn(service, 'getById')
        .mockResolvedValue({} as UserEntity);

      const result = await controller.getById(req as RequestWithUser, uuid);

      expect(result).toEqual({});
      expect(getById).toHaveBeenCalledWith(uuid);
    });
  });

  describe('updateUser', () => {
    it('should send updated user', async () => {
      const uuid = 'user-uuid';
      const data: Partial<UserEntity> = {
        email: 'update-user-email@email.com',
        password: 'update-password',
      };

      const updatedUser = jest
        .spyOn(service, 'updateUser')
        .mockResolvedValue(data as UserEntity);

      const result = await controller.updateUser(uuid, data as UserEntity);

      expect(result).toEqual(data);
      expect(updatedUser).toHaveBeenCalledWith(uuid, data as UserEntity);
    });
  });
});
