import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PostService } from '../post.service';
import { PostEntity } from '../../../entitties/post.entity';
import { CreatePostDto } from '../dtos/create-post.dto';
import { RequestWithUser } from '../../auth/strategies/jwt.strategy';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('PostService', () => {
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
      providers: [
        PostService,
        {
          provide: getRepositoryToken(PostEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PostService>(PostService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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

      jest.spyOn(mockRepository, 'create').mockResolvedValue(data);
      jest.spyOn(mockRepository, 'save').mockResolvedValue({ ...data, id: 1 });

      const result = await service.createPost(data, req as RequestWithUser);

      expect(result).toEqual({ ...data, id: 1 });
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...data,
        user_id: req.user.uuid,
      });
    });
  });

  describe('getPostById', () => {
    it('should send post by id', async () => {
      const postId = '1';

      jest.spyOn(mockRepository, 'findOneBy').mockResolvedValue({});

      const result = await service.getPostById(postId);

      expect(result).toEqual({});
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: +postId });
    });

    it('should throw NotFoundException Post with ID ${postId} not found', async () => {
      const postId = '1';

      jest.spyOn(mockRepository, 'findOneBy').mockResolvedValue(null);

      await expect(service.getPostById(postId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getAllPostsByUserId', () => {
    it('should send post by user id', async () => {
      const userId = 'user-uuid';

      jest.spyOn(mockRepository, 'findOneBy').mockResolvedValue({});
      jest.spyOn(mockRepository, 'find').mockResolvedValue([]);

      const result = await service.getAllPostsByUserId(userId);

      expect(result).toEqual([]);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({
        user_id: userId,
      });
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: {
          user_id: userId,
        },
      });
    });

    it('should throw NotFoundException User with ID ${userId} not found posts', async () => {
      const userId = 'user-uuid';

      jest.spyOn(mockRepository, 'findOneBy').mockResolvedValue(null);

      await expect(service.getAllPostsByUserId(userId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updatePost', () => {
    it('should send updated post', async () => {
      const postId = '1';
      const data: CreatePostDto = {
        title: 'new-title',
        content: 'new-content',
        goal: 'new-goal',
      };

      jest.spyOn(mockRepository, 'update').mockResolvedValue({});
      jest
        .spyOn(mockRepository, 'findOneBy')
        .mockResolvedValue({ ...data, id: 1 });

      const result = await service.updatePost(postId, data);

      expect(result).toEqual({ ...data, id: 1 });
      expect(mockRepository.update).toHaveBeenCalledWith({ id: +postId }, data);
    });
  });

  describe('deletePost', () => {
    it('should send deleted post', async () => {
      const postId = '1';
      const currentUserId = 'user-uuid';

      jest
        .spyOn(mockRepository, 'findOneBy')
        .mockResolvedValue({ user_id: currentUserId });
      jest.spyOn(mockRepository, 'delete').mockResolvedValue(undefined);

      await service.deletePost(postId, currentUserId);

      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: +postId });
      expect(mockRepository.delete).toHaveBeenCalledWith({ id: +postId });
    });

    it('should throw NotFoundException Post not found', async () => {
      const postId = '1';
      const currentUserId = 'user-uuid';

      jest.spyOn(mockRepository, 'findOneBy').mockResolvedValue(null);

      await expect(service.deletePost(postId, currentUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException You do not have permission to access this post.', async () => {
      const postId = '1';
      const currentUserId = 'user-uuid';

      jest
        .spyOn(mockRepository, 'findOneBy')
        .mockResolvedValue({ user_id: null });

      await expect(service.deletePost(postId, currentUserId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
