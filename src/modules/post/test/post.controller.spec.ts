import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PostController } from '../post.controller';
import { PostService } from '../post.service';
import { PostEntity } from '../../../entitties/post.entity';
import { CreatePostDto } from '../dtos/create-post.dto';
import { RequestWithUser } from '../../auth/strategies/jwt.strategy';

describe('PostController', () => {
  let controller: PostController;
  let service: PostService;

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
      controllers: [PostController],
      providers: [
        PostService,
        {
          provide: getRepositoryToken(PostEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    controller = module.get<PostController>(PostController);
    service = module.get<PostService>(PostService);
  });

  it('should be defined service', () => {
    expect(service).toBeDefined();
  });

  it('should be defined controller', () => {
    expect(controller).toBeDefined();
  });

  describe('createPost', () => {
    it('should send a new post', async () => {
      const data: CreatePostDto = {
        title: 'test',
        content: 'content',
        goal: 'goal',
      };

      const req: Partial<RequestWithUser> = {
        user: {
          uuid: 'user-uuid',
        },
      };

      jest.spyOn(service, 'createPost').mockResolvedValue({} as PostEntity);

      const result = await controller.createPost(data, req as RequestWithUser);

      expect(result).toEqual({});
      expect(service.createPost).toHaveBeenCalledWith(
        data,
        req as RequestWithUser,
      );
    });
  });

  describe('getPost', () => {
    it('should send post by id', async () => {
      const id = '1';

      jest.spyOn(service, 'getPostById').mockResolvedValue({} as PostEntity);

      const result = await controller.getPost(id);

      expect(result).toEqual({});
      expect(service.getPostById).toHaveBeenCalledWith(id);
    });
  });

  describe('getAllPostsByUserId', () => {
    it('should send all posts by user', async () => {
      const userId = 'user-uuid';

      jest
        .spyOn(service, 'getAllPostsByUserId')
        .mockResolvedValue([] as PostEntity[]);

      const result = await controller.getAllPostsByUserId(userId);

      expect(result).toEqual([]);
      expect(service.getAllPostsByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('updatePost', () => {
    it('should send updated post', async () => {
      const data: CreatePostDto = {
        title: 'test',
        content: 'content',
        goal: 'goal',
      };

      const id = '1';

      jest.spyOn(service, 'updatePost').mockResolvedValue({} as PostEntity);

      const result = await controller.updatePost(data, id);

      expect(result).toEqual({});
      expect(service.updatePost).toHaveBeenCalledWith(id, data);
    });
  });

  describe('deletePost', () => {
    it('should send deleted post', async () => {
      const id = '1';
      const req: Partial<RequestWithUser> = {
        user: {
          uuid: 'user-uuid',
        },
      };

      jest.spyOn(service, 'deletePost').mockResolvedValue(undefined);

      await controller.deletePost(id, req as RequestWithUser);

      expect(service.deletePost).toHaveBeenCalledWith(id, req.user.uuid);
    });
  });
});
