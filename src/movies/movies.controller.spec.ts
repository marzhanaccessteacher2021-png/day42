import { Test, TestingModule } from '@nestjs/testing';
import { MoviesService } from './movies.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Genre } from 'src/generated/prisma/enums';
import { CreateMovieDto } from './dto/create-movie.dto';
import { MoviesController } from './movies.controller';

/*
  Полный mock PrismaService
  Jest не будет импортировать настоящий Prisma Client
*/
// Создаём тип для Mock Prisma — все методы заменяются на jest.fn()
jest.mock('src/prisma/prisma.service', () => {
  return {
    PrismaService: jest.fn().mockImplementation(() => ({
      movie: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
    })),
  };
});

// Теперь PrismaService — это мок, и мы можем контролировать его поведение в тестах
describe('MoviesController', () => {
  let controller: MoviesController;
  let service: MoviesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MoviesController],
      providers: [MoviesService, PrismaService],
    }).compile();

    controller = module.get<MoviesController>(MoviesController);
    service = module.get<MoviesService>(MoviesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  // Очистим моки после каждого теста, чтобы избежать "загрязнения" между тестами
  afterEach(() => {
    jest.clearAllMocks();
  });

// Проверим, что MoviesController был создан
  it('должен быть определён', () => {
    expect(controller).toBeDefined();
  });

  // ─── findAll ───────────────────────────────────────────────
  describe('findAll', () => {

    it('должен вернуть страничный список фильмов', async () => {
      // ARRANGE
      const mockMovies = [
        { id: '1', title: 'Inception',       year: 2010, genre: Genre.SCI_FI },
        { id: '2', title: 'The Dark Knight', year: 2008, genre: Genre.ACTION },
      ];
      const mockMeta = { total: 2, page: 1, limit: 10, totalPages: 1 };

      (prisma.movie.findMany as jest.Mock).mockResolvedValue(mockMovies);
      (prisma.movie.count   as jest.Mock).mockResolvedValue(2);

      // ACT
      const result = await controller.findAll({ page: 1, limit: 10 } as any);

      // ASSERT
      expect(prisma.movie.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.movie.count).toHaveBeenCalledTimes(1);
      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
    });

    it('должен вернуть пустой список если фильмов нет', async () => {
      // ARRANGE
      (prisma.movie.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.movie.count   as jest.Mock).mockResolvedValue(0);

      // ACT
      const result = await controller.findAll({ page: 1, limit: 10 } as any);

      // ASSERT
      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('должен передавать query-параметры в сервис', async () => {
      // ARRANGE
      const query = { page: 2, limit: 5, genre: Genre.ACTION, year: 2008 };

      (prisma.movie.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.movie.count   as jest.Mock).mockResolvedValue(0);

      // ACT
      await controller.findAll(query as any);

      // ASSERT — Prisma должна получить корректные skip/take и where-условия
      expect(prisma.movie.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5, // (page - 1) * limit = (2 - 1) * 5
          take: 5,
        }),
      );
    });

  });

  // ─── findOne ───────────────────────────────────────────────
  describe('findOne', () => {

    it('должен вернуть фильм по ID', async () => {
      // ARRANGE
      const mockMovie = { id: 'uuid-1', title: 'Inception', year: 2010, genre: Genre.SCI_FI };
      (prisma.movie.findUnique as jest.Mock).mockResolvedValue(mockMovie);

      // ACT
      const result = await controller.findOne('uuid-1');

      // ASSERT
      expect(prisma.movie.findUnique).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
      expect(result).toEqual(mockMovie);
    });

    it('должен вернуть null если фильм не найден', async () => {
      // ARRANGE
      (prisma.movie.findUnique as jest.Mock).mockResolvedValue(null);

      // ACT
      const result = await controller.findOne('non-existent-id');

      // ASSERT
      expect(result).toBeNull();
    });

  });

  // ─── findOneWithReviews ────────────────────────────────────
  describe('findOneWithReviews', () => {

    it('должен вернуть фильм вместе с отзывами', async () => {
      // ARRANGE
      const mockMovie = {
        id:    'uuid-1',
        title: 'Inception',
        year:  2010,
        genre: Genre.SCI_FI,
        reviews: [
          {
            id:        'r1',
            rating:    5,
            comment:   'Отличный фильм!',
            createdAt: new Date(),
            user: { id: 'u1', name: 'John' },
          },
        ],
      };
      (prisma.movie.findUnique as jest.Mock).mockResolvedValue(mockMovie);

      // ACT
      const result = await controller.findOneWithReviews('uuid-1');

      // ASSERT
      expect(prisma.movie.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'uuid-1' } }),
      );
      expect(result).not.toBeNull();
      expect(result!.reviews).toHaveLength(1);
      expect(result!.reviews[0].rating).toBe(5);
    });

    it('должен вернуть null если фильм не найден', async () => {
      // ARRANGE
      (prisma.movie.findUnique as jest.Mock).mockResolvedValue(null);

      // ACT
      const result = await controller.findOneWithReviews('non-existent-id');

      // ASSERT
      expect(result).toBeNull();
    });

  });

  // ─── create ────────────────────────────────────────────────
  describe('create', () => {

    it('должен создать фильм и вернуть его', async () => {
      // ARRANGE
      const dto = {
        title:       'New Movie',
        description: 'Some description',
        year:        2024,
        genre:       Genre.DRAMA,
      };
      const created = { id: 'new-uuid', ...dto };
      (prisma.movie.create as jest.Mock).mockResolvedValue(created);

      // ACT
      const result = await controller.create(dto as any);

      // ASSERT
      expect(prisma.movie.create).toHaveBeenCalledWith({ data: dto });
      expect(result).toEqual(created);
      expect(result.id).toBeDefined();
      expect(result.title).toBe('New Movie');
    });

  });

  // ─── update ────────────────────────────────────────────────
  describe('update', () => {

    it('должен обновить фильм и вернуть обновлённые данные', async () => {
      // ARRANGE
      const updateDto = { title: 'Updated Title' };
      const updated   = {
        id:          'uuid-1',
        title:       'Updated Title',
        description: 'Some description',
        year:        2010,
        genre:       Genre.SCI_FI,
      };
      (prisma.movie.update as jest.Mock).mockResolvedValue(updated);

      // ACT
      const result = await controller.update('uuid-1', updateDto as any);

      // ASSERT
      expect(prisma.movie.update).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
        data:  updateDto,
      });
      expect(result.title).toBe('Updated Title');
    });

  });

  // ─── remove ────────────────────────────────────────────────
  describe('remove', () => {

    it('должен удалить фильм и вернуть его', async () => {
      // ARRANGE
      const deleted = { id: 'uuid-1', title: 'To Delete' };
      (prisma.movie.delete as jest.Mock).mockResolvedValue(deleted);

      // ACT
      const result = await controller.remove('uuid-1');

      // ASSERT
      expect(prisma.movie.delete).toHaveBeenCalledWith({
        where: { id: 'uuid-1' },
      });
      expect(result).toEqual(deleted);
    });

  });
});         
