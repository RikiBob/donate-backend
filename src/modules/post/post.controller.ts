import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto } from './dtos/create-post.dto';
import { CustomRequest } from '../auth/strategies/jwt.strategy';
import { JwtAuthGuard } from '../auth/guards/jwt.auth.guard';
import { PostEntity } from '../../entitties/post.entity';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  async createPost(
    @Body() data: CreatePostDto,
    @Req() req: CustomRequest,
  ): Promise<PostEntity> {
    return await this.postService.createPost(data, req);
  }

  @Get(':id')
  async getPost(@Param('id') id: string): Promise<PostEntity> {
    return await this.postService.getPostById(id);
  }

  @Get('/all_posts/:user_id')
  async getAllPostsByUserId(@Param('id') id: string): Promise<PostEntity[]> {
    return await this.postService.getAllPostsByUserId(id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updatePost(
    @Body() data: CreatePostDto,
    @Param('id') id: string,
  ): Promise<PostEntity> {
    return await this.postService.updatePost(id, data);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deletePost(
    @Param('id') id: string,
    @Req() req: CustomRequest,
  ): Promise<void> {
    await this.postService.deletePost(id, req.user.uuid);
  }
}
