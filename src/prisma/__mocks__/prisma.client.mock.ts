// src/prisma/__mocks__/prisma.client.mock.ts
// Заглушка для Prisma Client — заменяет ESM модуль который Jest не умеет читать

export class PrismaClient {
  $connect = jest.fn();
  $disconnect = jest.fn();
}