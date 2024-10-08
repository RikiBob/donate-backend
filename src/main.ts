import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';

const PORT = process.env.PORT || 7000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useLogger(app.get(Logger));

  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser());

  await app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}
bootstrap();
