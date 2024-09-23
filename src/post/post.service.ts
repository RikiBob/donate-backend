import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PostEntity } from '../entitties/post.entity';
import { Repository } from 'typeorm';
import { CreatePostDto } from './dtos/create-post.dto';
import { PostDto } from './dtos/post.dto';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(PostEntity)
    private readonly postsRepository: Repository<PostEntity>,
  ) {}

  async createPost(data: CreatePostDto) {
    const post = await this.postsRepository.save(data);
    return this.buildPost(post);
  }

  async updatePost(idStr: string, data: CreatePostDto): Promise<PostDto> {
    const id = Number(idStr.replace(/^:/, ''));
    await this.postsRepository.update({ id }, data);
    const post = await this.postsRepository.findOneBy({ id });
    return this.buildPost(post);
  }

  // async deletePost(id: string, user: string): Promise<void> {
  //   const userByPost = await this.postsRepository.findOneBy({ id });
  //   if (user !== userByPost.user.uuid) {
  //     throw new ForbiddenException(
  //       'You do not have permission to access this post.',
  //     );
  //   }

    // await this.postsRepository.delete({ id });
  // }

  buildPost(post: PostEntity) {
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      goal: post.goal,
    };
  }
}
