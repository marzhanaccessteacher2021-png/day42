import request from 'supertest';
import { app, prisma, setupApp, cleanDatabase, registerUser } from './setup';
import { Genre } from 'src/generated/prisma/enums';

// Этот файл содержит E2E тесты для отзывов. Мы проверяем создание отзыва, получение всех отзывов, получение отзывов по фильму, и удаление отзыва. В каждом тесте мы используем реальную базу данных (очищаем её перед каждым тестом) и реальное Nest-приложение, чтобы максимально точно имитировать поведение в продакшене.
describe('Reviews E2E', () => {
  let userToken: string;
  let userId: string;
  let movieId: string;
  let reviewId: string;

  // Инициализация приложения и PrismaService один раз для всех тестов, а также очистка базы данных и создание тестовых данных перед каждым тестом
  beforeAll(async () => {
    await setupApp();
  });

  // Перед каждым тестом мы очищаем базу данных и создаём нового пользователя, фильм и отзыв, чтобы обеспечить изоляцию тестов и гарантировать наличие данных для тестирования
  beforeEach(async () => {
    await cleanDatabase();

    // Создадим пользователя, фильм и отзыв для тестов
    await registerUser('reviewer@test.com', 'pass123', 'Reviewer');
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'reviewer@test.com', password: 'pass123' });
    userToken = login.body.accessToken;

    const user = await prisma.user.findUnique({
      where: { email: 'reviewer@test.com' },
    });
    userId = user!.id;

    const movie = await prisma.movie.create({
      data: {
        title: 'Review Movie',
        description: 'Test',
        year: 2021,
        genre: Genre.DRAMA,
      },
    });
    movieId = movie.id;

    const review = await prisma.review.create({
      data: { rating: 8, comment: 'Хороший фильм', userId, movieId },
    });
    reviewId = review.id;
  });

  afterAll(async () => {
    await cleanDatabase();
  }); // убрали app.close()

  // В этих тестах мы проверяем, что авторизованный пользователь может создать отзыв, что без токена возвращается 401, и что при создании отзыва с невалидным рейтингом возвращается 400
  describe('POST /reviews', () => {
    it('авторизованный пользователь должен создать отзыв', async () => {
      const res = await request(app.getHttpServer())
        .post('/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ rating: 9, comment: 'Отлично!', movieId }); // убрали userId

      expect(res.status).toBe(201);
      expect(res.body.rating).toBe(9);
      expect(res.body.movieId).toBe(movieId);
    });

    it('должен вернуть 401 без токена', async () => {
      const res = await request(app.getHttpServer())
        .post('/reviews')
        .send({ rating: 7, movieId }); // убрали userId
      expect(res.status).toBe(401);
    });

    it('должен вернуть 400 если rating вне диапазона 1-10', async () => {
      const res = await request(app.getHttpServer())
        .post('/reviews')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ rating: 11, movieId }); // убрали userId
      expect(res.status).toBe(400);
    });
  });

  //  В этих тестах мы проверяем, что можно получить все отзывы, что можно получить отзывы конкретного фильма, и что при удалении отзыва он действительно удаляется из базы данных
  describe('GET /reviews', () => {
    it('должен вернуть все отзывы', async () => {
      const res = await request(app.getHttpServer())
        .get('/reviews')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
  });

  // В этих тестах мы проверяем, что можно получить отзывы конкретного фильма, что для фильма без отзывов возвращается пустой массив, и что при удалении отзыва он действительно удаляется из базы данных
  describe('GET /reviews/movie/:movieId', () => {
    it('должен вернуть отзывы конкретного фильма', async () => {
      const res = await request(app.getHttpServer())
        .get(`/reviews/movie/${movieId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.every((r: any) => r.movieId === movieId)).toBe(true);
    });

    it('должен вернуть пустой массив если у фильма нет отзывов', async () => {
      const newMovie = await prisma.movie.create({
        data: {
          title: 'No Reviews',
          description: 'x',
          year: 2022,
          genre: Genre.COMEDY,
        },
      });

      const res = await request(app.getHttpServer())
        .get(`/reviews/movie/${newMovie.id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });
  // В этих тестах мы проверяем, что авторизованный пользователь может удалить свой отзыв, что без токена возвращается 401, и что при удалении отзыва он действительно удаляется из базы данных
  describe('DELETE /reviews/:id', () => {
    it('авторизованный пользователь должен удалить отзыв', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/reviews/${reviewId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);

      const inDb = await prisma.review.findUnique({ where: { id: reviewId } });
      expect(inDb).toBeNull();
    });

    it('без токена должен вернуть 401', async () => {
      const res = await request(app.getHttpServer()).delete(
        `/reviews/${reviewId}`,
      );
      expect(res.status).toBe(401);
    });
  });
});
