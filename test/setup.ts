import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import cookieParser from 'cookie-parser';
import request from 'supertest';

// Этот файл содержит общую настройку для всех тестов, чтобы избежать дублирования кода
export let app: INestApplication;
export let prisma: PrismaService;

let isInitialized = false;

// Инициализация приложения и PrismaService один раз для всех тестов
export async function setupApp() {
  if (isInitialized) return;
  isInitialized = true;

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  // Настраиваем Nest-приложение для тестов
  app = moduleFixture.createNestApplication();
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  await app.init();
  prisma = moduleFixture.get<PrismaService>(PrismaService);
}

// очистим базу данных перед каждым тестом, чтобы обеспечить изоляцию тестов
export async function cleanDatabase() {
  await prisma.review.deleteMany();
  await prisma.movie.deleteMany();
  await prisma.user.deleteMany();
}

// Функция для регистрации пользователя, которая может быть использована в тестах
export async function registerUser(email: string, password: string, name: string) {
  const res = await request(app.getHttpServer())
    .post('/auth/register')
    .send({ email, password, name });

  if (res.status !== 201) {
    throw new Error(`registerUser failed [${res.status}]: ${JSON.stringify(res.body)}`);
  }
  return res;
}

// Функция для логина пользователя, которая возвращает JWT токен для авторизации в тестах
export async function loginAs(email: string, password: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password });
  return res.body.accessToken;
}