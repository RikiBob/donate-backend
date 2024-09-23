import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from "@nestjs/common";

const PORT = process.env.PORT || 7000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser());

  await app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
}
bootstrap();

//    "migration:create": "npm run  build && npm run typeorm migration:create -- -n init -d src/migrations",
//    "migration:generate": "npm run build && npm run typeorm migration:generate -- -n",
//    "migration:run": "npm run build && npm run typeorm migration:run",
//    "migration:down": "npm run typeorm migration:revert"