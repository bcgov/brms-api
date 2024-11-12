import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as winston from 'winston';
import { WinstonModule } from 'nest-winston';
import { AppModule } from './app.module';
import { winstonConfig } from './winston-config.service';

async function bootstrap() {
  // Setup app with logging
  const logger = winston.createLogger(winstonConfig);
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: WinstonModule.createLogger({
      instance: logger, // Pass the custom Winston instance
    }),
  });
  // Enable CORS for frontend
  app.enableCors({
    origin: process.env.FRONTEND_URI,
  });
  // Start the app on the specified port
  const port = process.env.PORT || 3000;
  await app.listen(process.env.PORT || 3000);
  logger.info(`Server is running on port ${port} with ${process.env.FRONTEND_URI} allowed origins.`);
}
bootstrap();
