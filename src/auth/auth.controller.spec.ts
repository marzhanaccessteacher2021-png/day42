import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';

/*
  Полный mock AuthService
  Jest не будет импортировать настоящий AuthService
*/
jest.mock('./auth.service', () => {
  return {
    AuthService: jest.fn().mockImplementation(() => ({
      register: jest.fn(),
      login:    jest.fn(),
      refresh:  jest.fn(),
      logout:   jest.fn(),
    })),
  };
});

// Вспомогательная функция для создания mock Response
const mockResponse = () => {
  const res: Partial<Response> = {
    cookie:      jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    json:        jest.fn().mockReturnThis(),
    status:      jest.fn().mockReturnThis(),
  };
  return res as Response;
};

// Вспомогательная функция для создания mock Request
const mockRequest = (cookies: Record<string, string> = {}) => {
  const req: Partial<Request> = { cookies };
  return req as Request;
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      // В тестах мы используем настоящий AuthController, но AuthService — мок
      controllers: [AuthController],
      providers:   [AuthService],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  // Очистим моки после каждого теста, чтобы избежать "загрязнения" между тестами
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Проверим, что AuthController был создан
  it('должен быть определён', () => {
    expect(controller).toBeDefined();
  });

  // ─── register ─────────────────────────────────────────────
  describe('register', () => {

    it('должен вызвать authService.register и вернуть результат', async () => {
      // ARRANGE
      const dto = {
        email:    'test@example.com',
        password: 'strongPassword123',
        name:     'John Doe',
      };
      const mockResult = { accessToken: 'access-token' };
      const res = mockResponse();

      (authService.register as jest.Mock).mockResolvedValue(mockResult);

      // ACT
      const result = await controller.register(res, dto as any);

      // ASSERT
      expect(authService.register).toHaveBeenCalledWith(res, dto);
      expect(authService.register).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResult);
    });

    it('должен пробросить ошибку если authService.register выбросил исключение', async () => {
      // ARRANGE
      const dto = { email: 'exists@example.com', password: '123', name: 'Jane' };
      const res = mockResponse();

      (authService.register as jest.Mock).mockRejectedValue(
        new Error('User already exists'),
      );

      // ACT & ASSERT
      await expect(controller.register(res, dto as any)).rejects.toThrow(
        'User already exists',
      );
    });

  });

  // ─── login ────────────────────────────────────────────────
  describe('login', () => {

    it('должен вызвать authService.login и вернуть результат', async () => {
      // ARRANGE
      const dto = { email: 'test@example.com', password: 'password123' };
      const mockResult = { accessToken: 'access-token' };
      const res = mockResponse();

      (authService.login as jest.Mock).mockResolvedValue(mockResult);

      // ACT
      const result = await controller.login(res, dto as any);

      // ASSERT
      expect(authService.login).toHaveBeenCalledWith(res, dto);
      expect(authService.login).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResult);
    });

    it('должен пробросить ошибку если переданы неверные credentials', async () => {
      // ARRANGE
      const dto = { email: 'test@example.com', password: 'wrongPassword' };
      const res = mockResponse();

      (authService.login as jest.Mock).mockRejectedValue(
        new Error('Invalid credentials'),
      );

      // ACT & ASSERT
      await expect(controller.login(res, dto as any)).rejects.toThrow(
        'Invalid credentials',
      );
    });

  });

  // ─── refresh ──────────────────────────────────────────────
  describe('refresh', () => {

    it('должен вызвать authService.refresh и вернуть новый accessToken', async () => {
      // ARRANGE
      const req = mockRequest({ refreshToken: 'valid-refresh-token' });
      const res = mockResponse();
      const mockResult = { accessToken: 'new-access-token' };

      (authService.refresh as jest.Mock).mockResolvedValue(mockResult);

      // ACT
      const result = await controller.refresh(req, res);

      // ASSERT
      expect(authService.refresh).toHaveBeenCalledWith(req, res);
      expect(authService.refresh).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResult);
    });

    it('должен пробросить ошибку если refresh-токен невалиден', async () => {
      // ARRANGE
      const req = mockRequest({ refreshToken: 'expired-token' });
      const res = mockResponse();

      (authService.refresh as jest.Mock).mockRejectedValue(
        new Error('Refresh token expired'),
      );

      // ACT & ASSERT
      await expect(controller.refresh(req, res)).rejects.toThrow(
        'Refresh token expired',
      );
    });

  });

  // ─── logout ───────────────────────────────────────────────
  describe('logout', () => {

    it('должен вызвать authService.logout и вернуть результат', async () => {
      // ARRANGE
      const res = mockResponse();
      const mockResult = { message: 'Logged out successfully' };

      (authService.logout as jest.Mock).mockResolvedValue(mockResult);

      // ACT
      const result = await controller.logout(res);

      // ASSERT
      expect(authService.logout).toHaveBeenCalledWith(res);
      expect(authService.logout).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResult);
    });

  });

  // ─── me ───────────────────────────────────────────────────
  describe('me', () => {

    it('должен вернуть объект с id текущего пользователя', async () => {
      // ARRANGE
      const userId = 'uuid-current-user';

      // ACT
      // Декоратор @Authorized('id') в реальности извлекает id из JWT-токена,
      // в unit-тесте мы передаём id напрямую как аргумент
      const result = await controller.me(userId);

      // ASSERT
      expect(result).toEqual({ id: userId });
    });

    it('должен вернуть объект с корректным id для разных пользователей', async () => {
      // ARRANGE
      const userId = 'another-uuid-456';

      // ACT
      const result = await controller.me(userId);

      // ASSERT
      expect(result).toEqual({ id: 'another-uuid-456' });
      expect(result.id).toBe(userId);
    });

  });

});