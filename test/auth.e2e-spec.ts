import request from 'supertest';
import { app, prisma, setupApp, cleanDatabase } from './setup';

describe('Auth E2E', () => {
  // Запускаем приложение один раз для всего файла
  beforeAll(async () => {
    await setupApp();
  });

  // Очищаем БД перед каждым тестом
  beforeEach(async () => {
    await cleanDatabase();
  });

  // Закрываем приложение после всех тестов
  afterAll(async () => {
    await cleanDatabase();
    //await app.close();
  });

  // ─── REGISTER ──────────────────────────────────────────
  describe('POST /auth/register', () => {
    it('должен зарегистрировать пользователя и вернуть accessToken', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'pass123',
          name: 'Test User',
        });

      expect(res.status).toBe(201);
      expect(res.body.accessToken).toBeDefined();
      expect(typeof res.body.accessToken).toBe('string');
    });

    it('должен сохранить пользователя в базе данных', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'db@example.com',
          password: 'pass123',
          name: 'DB User',
        });

      // Проверяем через Prisma напрямую
      const user = await prisma.user.findUnique({
        where: { email: 'db@example.com' },
      });
      expect(user).not.toBeNull();
      expect(user!.name).toBe('DB User');
      // Пароль должен быть захеширован
      expect(user!.password).not.toBe('pass123');
    });

    it('должен вернуть 409 если email уже занят', async () => {
      const dto = {
        email: 'dup@example.com',
        password: 'pass123',
        name: 'User',
      };
      // Регистрируем первый раз
      await request(app.getHttpServer()).post('/auth/register').send(dto);
      // Регистрируем с тем же email
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send(dto);

      expect(res.status).toBe(409);
    });

    it('должен вернуть 400 если email невалиден', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'not-an-email', password: 'pass123', name: 'User' });

      expect(res.status).toBe(400);
    });

    it('должен вернуть 400 если пароль короче 6 символов', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'ok@example.com', password: '123', name: 'User' });

      expect(res.status).toBe(400);
    });
  });

  // ─── LOGIN ─────────────────────────────────────────────
  describe('POST /auth/login', () => {
    it('должен вернуть accessToken при верных данных', async () => {
      // Сначала регистрируем
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'login@example.com',
          password: 'pass123',
          name: 'Login User',
        });

      // Логинимся
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'login@example.com', password: 'pass123' });

      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
    });

    it('должен установить cookie refreshToken', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'cookie@example.com',
          password: 'pass123',
          name: 'Cookie User',
        });

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'cookie@example.com', password: 'pass123' });

      // Проверяем что в cookie есть refreshToken
      expect(res.headers['set-cookie']).toBeDefined();
      const cookies = [res.headers['set-cookie']]
        .flat()
        .filter(Boolean) as string[];
      expect(cookies.some((c) => c.startsWith('refreshToken='))).toBe(true);
    });

    it('должен вернуть 404 если пользователь не существует', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nobody@example.com', password: 'pass123' });

      expect(res.status).toBe(404);
    });

    it('должен вернуть 404 если пароль неверный', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'wrong@example.com',
          password: 'pass123',
          name: 'User',
        });

      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'wrong@example.com', password: 'WRONGPASS' });

      expect(res.status).toBe(404);
    });
  });

  // ─── GET /auth/me ───────────────────────────────────────
  describe('GET /auth/me', () => {
    it('должен вернуть id пользователя по токену', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'me@example.com',
          password: 'pass123',
          name: 'Me User',
        });
      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'me@example.com', password: 'pass123' });
      const token = login.body.accessToken;

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBeDefined();
    });

    it('должен вернуть 401 без токена', async () => {
      const res = await request(app.getHttpServer()).get('/auth/me');

      expect(res.status).toBe(401);
    });

    it('должен вернуть 401 с невалидным токеном', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer totally.invalid.token');

      expect(res.status).toBe(401);
    });
  });
});
