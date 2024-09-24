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
    const parseId = Number(postId.replace(/^:/, ''));
    const post = await this.postsRepository.findOneBy({ id: parseId });
    if (!post) {
      throw new NotFoundException(`Post with ID ${parseId} not found`);
    }

    return post;
  }

  async getAllPostsByUserId(userId: string): Promise<PostEntity[]> {
    const parseId = userId.replace(/^:/, '');
    const user = await this.postsRepository.findOneBy({ user_id: parseId });
    if (!user) {
      throw new NotFoundException(`User with ID ${parseId} not found`);
    }

    return this.postsRepository.find({
      where: { user_id: parseId },
    });
  }

  async updatePost(postId: string, data: CreatePostDto): Promise<PostEntity> {
    const parseId = Number(postId.replace(/^:/, ''));
    await this.postsRepository.update({ id: parseId }, data);
    return await this.postsRepository.findOneBy({ id: parseId });
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
