import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { setupSwagger } from './utils/swagger.util';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());

  // Это разрешает запросы с Next.js фронтенда
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001', // адрес Next.js
    credentials: true, // ОБЯЗАТЕЛЬНО — иначе cookies не работают
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  setupSwagger(app);

  await app.listen(process.env.PORT || 3000); // NestJS остаётся на 3000 порту
}
bootstrap();
