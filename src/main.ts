import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
// TODO: Remove this once it has run on prod
import filepathMigration from './migrations/filepath-migration';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: process.env.FRONTEND_URI,
  });
  const port = process.env.PORT || 3000;
  // TODO: Remove this call once it has run on prod
  if (process.env.NODE_ENV !== 'test') {
    filepathMigration();
  }
  await app.listen(process.env.PORT || 3000);
  console.log(`Server is running on port ${port} with ${process.env.FRONTEND_URI} allowed origins.`);
}
bootstrap();
