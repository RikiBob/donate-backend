import { Module } from '@nestjs/common';
import { UserModule } from './modules/user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './modules/auth/auth.module';
import { PostModule } from './modules/post/post.module';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { WayforpayModule } from './modules/wayforpay/wayforpay.module';
import { LoggerModule } from 'nestjs-pino';
import { v4 as uuidv4 } from 'uuid';
import { createWriteStream } from 'pino-stackdriver';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const logName = `${configService.get('GCP_LOG_NAME')}-${configService.get('APP_ENVIRONMENT')}`;

        const writeStream = createWriteStream({
          credentials: {
            client_email: configService.get('GCP_LOGGING_EMAIL'),
            private_key: configService
              .get('GCP_LOGGING_PRIVATE_KEY')
              .replace(/\\n/g, '\n'),
          },
          projectId: configService.get('GCP_PROJECT_ID'),
          logName: logName,
          resource: {
            type: 'global',
          },
        });

        return {
          pinoHttp: {
            name: logName,
            stream: writeStream,
            redact: ['req.headers.authorization'],
            customProps: () => ({
              context: 'HTTP',
            }),
            genReqId: () => uuidv4(),
          },
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UserModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'static'),
    }),
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
        synchronize: true,
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    PostModule,
    WayforpayModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
