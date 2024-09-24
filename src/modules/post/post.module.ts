import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from '../../entitties/post.entity';
import { UserEntity } from '../../entitties/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PostEntity, UserEntity])],
  controllers: [PostController],
  providers: [PostService],
})
export class PostModule {}
