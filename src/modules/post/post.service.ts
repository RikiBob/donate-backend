import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from '../../entitties/post.entity';
import { Repository } from 'typeorm';
import { CreatePostDto } from './dtos/create-post.dto';
import { CustomRequest } from '../auth/strategies/jwt.strategy';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postsRepository: Repository<PostEntity>,
  ) {}

  async createPost(data: CreatePostDto, req: CustomRequest) {
    const post = this.postsRepository.create({
      ...data,
      user_id: req.user.uuid,
    });
    return await this.postsRepository.save(post);
  }

  async getPostById(postId: string): Promise<PostEntity> {
    const post = await this.postsRepository.findOneBy({ id: +postId });
    if (!post) {
      throw new NotFoundException(`Post with ID ${postId} not found`);
    }

    return post;
  }

  async getAllPostsByUserId(userId: string): Promise<PostEntity[]> {
    const user = await this.postsRepository.findOneBy({ user_id: userId });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.postsRepository.find({
      where: { user_id: userId },
    });
  }

  async updatePost(postId: string, data: CreatePostDto): Promise<PostEntity> {
    await this.postsRepository.update({ id: +postId }, data);
    return await this.postsRepository.findOneBy({ id: +postId });
  }

  async deletePost(postId: string, currentUserId: string): Promise<void> {
    const parseId = Number(postId.replace(/^:/, ''));
    const userByPost = await this.postsRepository.findOneBy({ id: parseId });

    if (currentUserId !== userByPost.user_id) {
      throw new ForbiddenException(
        'You do not have permission to access this post.',
      );
    }

    await this.postsRepository.delete({ id: parseId });
  }
}
