import { Module } from '@nestjs/common';
import { UserModule } from './modules/user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entitties/user.entity';
import { AuthModule } from './modules/auth/auth.module';
import { PostEntity } from './entitties/post.entity';
import { PostModule } from './modules/post/post.module';

@Module({
  imports: [
    AuthModule,
    UserModule,
    ConfigModule.forRoot({
      envFilePath: '.env',
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('TYPEORM_HOST'),
        port: Number(configService.get('TYPEORM_PORT')),
        username: 'postgres',
        password: 'postgres',
        database: configService.get('TYPEORM_DATABASE'),
        logging: configService.get('TYPEORM_LOGGING'),
        synchronize: false,
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    PostModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
