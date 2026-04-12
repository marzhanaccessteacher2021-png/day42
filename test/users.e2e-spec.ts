import request from 'supertest';
import {
  app,
  prisma,
  setupApp,
  cleanDatabase,
  loginAs,
  registerUser,
} from './setup';
import { Genre } from 'src/generated/prisma/enums';

// Этот файл содержит E2E тесты для пользователей. Мы проверяем получение профиля текущего пользователя и получение списка всех пользователей (только для админа). В каждом тесте мы используем реальную базу данных (очищаем её перед каждым тестом) и реальное Nest-приложение, чтобы максимально точно имитировать поведение в продакшене.
describe('Users E2E', () => {
  let userToken: string;
  let userId: string;

  beforeAll(async () => {
    await setupApp();
  });

  beforeEach(async () => {
    await cleanDatabase(); // убрали app.close() отсюда

    // Создадим пользователя для тестов
    await registerUser('profile@test.com', 'pass123', 'Profile User');
    userToken = await loginAs('profile@test.com', 'pass123');
    const user = await prisma.user.findUnique({
      where: { email: 'profile@test.com' },
    });
    userId = user!.id;
  });

  // Мы не закрываем приложение после каждого теста, чтобы избежать проблем с повторной инициализацией. Вместо этого мы закрываем его один раз после всех тестов в этом файле, так как users.e2e-spec.ts должен быть последним, кто закроет приложение.
  afterAll(async () => {
    await cleanDatabase();
    await app.close(); // только здесь, один раз
  });

  // В этих тестах мы проверяем, что профиль текущего пользователя возвращается корректно, что в профиле нет поля password, что в профиле есть массив reviews, и что без токена возвращается 401
  describe('GET /users/profile', () => {
    it('должен вернуть профиль текущего пользователя', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('profile@test.com');
      expect(res.body.name).toBe('Profile User');
      expect(res.body.id).toBe(userId);
    });

    it('профиль не должен содержать password', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.body).not.toHaveProperty('password');
    });

    it('профиль должен содержать массив reviews', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('reviews');
      expect(Array.isArray(res.body.reviews)).toBe(true);
    });

    it('профиль должен включать отзывы если они есть', async () => {
      const movie = await prisma.movie.create({
        data: {
          title: 'Profile Movie',
          description: 'x',
          year: 2023,
          genre: Genre.SCI_FI,
        },
      });
      await prisma.review.create({
        data: { rating: 10, comment: 'Шедевр', userId, movieId: movie.id },
      });

      const res = await request(app.getHttpServer())
        .get('/users/profile')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.reviews).toHaveLength(1);
      expect(res.body.reviews[0].rating).toBe(10);
      expect(res.body.reviews[0].movie.title).toBe('Profile Movie');
    });

    it('должен вернуть 401 без токена', async () => {
      const res = await request(app.getHttpServer()).get('/users/profile');
      expect(res.status).toBe(401);
    });
  });

  // В этих тестах мы проверяем, что список всех пользователей возвращается только для админа, и что обычный пользователь получает 403 при попытке получить список всех пользователей
  describe('GET /users', () => {
    it('должен вернуть 403 для обычного пользователя', async () => {
      // GET /users закрыт для обычных юзеров — только ADMIN
      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });
});
