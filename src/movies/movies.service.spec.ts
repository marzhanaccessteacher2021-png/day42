import { Test, TestingModule } from '@nestjs/testing';
import { MoviesService } from './movies.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { Genre } from 'src/generated/prisma/enums';
import { CreateMovieDto } from './dto/create-movie.dto';

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
describe('MoviesService', () => {
  let service: MoviesService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      // В тестах мы используем настоящий MoviesService, но PrismaService — мок
      providers: [MoviesService, PrismaService],
    }).compile();

    service = module.get<MoviesService>(MoviesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  // Очистим моки после каждого теста, чтобы избежать "загрязнения" между тестами
  afterEach(() => {
    jest.clearAllMocks();
  });

  // Проверим, что MoviesService был создан
  it('должен быть определен', () => {
    expect(service).toBeDefined();
  });

  // Паттерн тестирования: Arrange (подготовка) — Act (действие) — Assert (проверка)
  
  // CREATE
  // ARRANGE: подготовка данных и моков
  it('должен создать новый фильм', async () => {
    const dto: CreateMovieDto = {
      title: 'Inception',
      description: 'Movie about dreams',
      year: 2010,
      genre: Genre.SCI_FI,
    };

    // Mock Prisma так, чтобы при вызове create он возвращал объект с id и данными из dto
    (prisma.movie.create as jest.Mock).mockResolvedValue({
      id: '1',
      ...dto,
    });

    // ACT: вызов метода, который мы тестируем
    const result = await service.create(dto);

    // Проверим, что Prisma был вызван с правильными аргументами
    expect(prisma.movie.create).toHaveBeenCalledWith({
      data: dto,
    });

    // ASSERT: проверка результата
    // Проверим, что возвращается правильный объект
    expect(result.title).toBe('Inception');
  });

  // FIND ALL
  it('должен вернуть страничный список фильмов', async () => {
    const movies = [
      { id: '1', title: 'Movie 1' },
      { id: '2', title: 'Movie 2' },
    ];

    // Mock Prisma так, чтобы findMany возвращал массив фильмов, а count — общее количество
    (prisma.movie.findMany as jest.Mock).mockResolvedValue(movies);
    // Важно: count должен возвращать общее количество, а не длину массива findMany
    (prisma.movie.count as jest.Mock).mockResolvedValue(2);

    // Проверим, что findMany вызывается с правильными аргументами
    const result = await service.findAll({
      page: 1,
      limit: 10,
    } as any);

    // Проверим, что findMany вызывается с правильными аргументами
    expect(prisma.movie.findMany).toHaveBeenCalled();

    // Проверим, что возвращается правильный объект
    expect(result.data.length).toBe(2);
    // Проверим, что возвращается правильное общее количество
    expect(result.meta.total).toBe(2);
  });

  // FIND ONE
  it('должен вернуть один фильм по id', async () => {
    const movie = {
      id: '1',
      title: 'Inception',
      description: 'Dream movie',
      year: 2010,
      genre: Genre.SCI_FI,
    };

    // Mock Prisma так, чтобы при вызове findUnique возвращал movie
    (prisma.movie.findUnique as jest.Mock).mockResolvedValue(movie);

    // Проверим, что findUnique вызывается с правильными аргументами
    const result = await service.findOne('1');

    // Проверим, что findUnique вызывается с правильными аргументами
    expect(prisma.movie.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
    });

    // Проверим, что возвращается правильный объект
    expect(result).toEqual(movie);
  });

  // FIND ONE WITH REVIEWS
  it('должен вернуть фильм с отзывами', async () => {
    const movie = {
      id: '1',
      title: 'Inception',
      year: 2010,
      genre: Genre.SCI_FI,
      reviews: [
        {
          id: 'r1',
          rating: 5,
          comment: 'Great movie!',
          createdAt: new Date(),
          user: {
            id: 'u1',
            name: 'John',
          },
        },
      ],
    };

    // Mock Prisma так, чтобы при вызове findUnique возвращал movie с отзывами
    (prisma.movie.findUnique as jest.Mock).mockResolvedValue(movie);

    const result = await service.findOneWithReviews('1');

    // Проверим, что findUnique вызывается с правильными аргументами
    expect(prisma.movie.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
      select: {
        id: true,
        title: true,
        year: true,
        genre: true,
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    expect(result).not.toBeNull();
    expect(result!.reviews.length).toBe(1);
  });

  // UPDATE
  it('должен обновить фильм', async () => {
    const updateDto = {
      title: 'Updated Movie',
    };

    (prisma.movie.update as jest.Mock).mockResolvedValue({
      id: '1',
      description: 'Dream movie',
      year: 2010,
      genre: Genre.SCI_FI,
      ...updateDto,
    });

    const result = await service.update('1', updateDto as any);

    expect(prisma.movie.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: updateDto,
    });

    expect(result.title).toBe('Updated Movie');
  });

  // DELETE
  it('должен удалить фильм', async () => {
    (prisma.movie.delete as jest.Mock).mockResolvedValue({
      id: '1',
    });

    const result = await service.remove('1');

    expect(prisma.movie.delete).toHaveBeenCalledWith({
      where: { id: '1' },
    });

    expect(result.id).toBe('1');
  });
});
