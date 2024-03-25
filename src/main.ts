import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: process.env.FRONTEND_URI,
  });
  const port = process.env.PORT || 3000;
  await app.listen(process.env.PORT || 3000);
  console.log(`Server is running on port ${port}`);
}
bootstrap();
