import {
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dtos/create-post.dto';
import { PostDto } from './dtos/post.dto';
import { CustomRequest } from '../modules/auth/strategies/jwt.strategy';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post('create')
  async createPost(@Body() data: CreatePostDto): Promise<PostDto> {
    return await this.postService.createPost(data);
  }

  @Put(':id')
  async updatePost(
    @Body() data: CreatePostDto,
    @Param('id') idStr: string,
  ): Promise<PostDto> {
    return await this.postService.updatePost(idStr, data);
  }

  @Delete(':id')
  async deletePost(
    @Param('id') id: string,
    @Req() req: CustomRequest,
  ): Promise<void> {
    // return await this.postService.deletePost(id, req.user.uuid);
  }
}
