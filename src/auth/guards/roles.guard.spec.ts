import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { Role } from '../enums/role.enum';

// Функция для создания фейкового ExecutionContext
function createMockContext(userRole: Role | null, requiredRoles: Role[] | undefined) {
  return {
    getHandler: () => ({}),
    getClass:   () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({
        // Имитируем req.user который устанавливает JwtGuard
        user: userRole ? { id: "user-uuid", role: userRole } : null,
      }),
    }),
  } as any;
}

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  describe('когда @Roles() не указан на маршруте', () => {

    it('должен пропустить запрос (return true)', () => {
      // Reflector вернёт undefined если декоратора нет
      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);
      const ctx = createMockContext(Role.USER, undefined);

      const result = guard.canActivate(ctx);

      expect(result).toBe(true);
    });

  });

  describe('когда @Roles(Role.ADMIN) указан', () => {

    it('должен пропустить ADMIN', () => {
      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([Role.ADMIN]);
      const ctx = createMockContext(Role.ADMIN, [Role.ADMIN]);

      const result = guard.canActivate(ctx);

      expect(result).toBe(true);
    });

    it('должен бросить ForbiddenException для USER', () => {
      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([Role.ADMIN]);
      const ctx = createMockContext(Role.USER, [Role.ADMIN]);

      // Ожидаем что guard.canActivate() бросит ForbiddenException
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

    it('должен бросить ForbiddenException если user = null (нет токена)', () => {
      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([Role.ADMIN]);
      const ctx = createMockContext(null, [Role.ADMIN]);

      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    });

  });

  describe('когда @Roles(Role.USER) указан', () => {

    it('должен пропустить USER', () => {
      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([Role.USER]);
      const ctx = createMockContext(Role.USER, [Role.USER]);

      const result = guard.canActivate(ctx);

      expect(result).toBe(true);
    });

    it('должен пропустить ADMIN (у него тоже есть доступ)', () => {
      jest.spyOn(reflector, "getAllAndOverride").mockReturnValue([Role.USER, Role.ADMIN]);
      const ctx = createMockContext(Role.ADMIN, [Role.USER, Role.ADMIN]);

      const result = guard.canActivate(ctx);

      expect(result).toBe(true);
    });

  });

});
