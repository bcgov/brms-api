import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

jest.mock('@nestjs/core', () => {
  return {
    NestFactory: {
      create: jest.fn().mockImplementation(() => {
        return {
          enableCors: jest.fn(),
          listen: jest.fn(),
        };
      }),
    },
  };
});

describe('main.ts', () => {
  it('should bootstrap the application', async () => {
    await require('./main');
    expect(NestFactory.create).toHaveBeenCalledWith(AppModule);
  });
});
