import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: process.env.FRONTEND_URI,
  });
  const port = process.env.PORT || 3000;
  await app.listen(process.env.PORT || 3000);
  console.log(`Server is running on port ${port} with ${process.env.FRONTEND_URI} allowed origins.`);
}
bootstrap();
