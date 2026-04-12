
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { QueryMoviesDto } from './dto/query-movies.dto';

@Injectable()
export class MoviesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMovieDto) {
    return await this.prisma.movie.create({ data: dto });
  }

  async findAll(query: QueryMoviesDto) {
    const {
      page = 1,
      limit = 10,
      genre,
      year,
      title,
      sortBy = 'createdAt',
      order = 'desc',
    } = query;

    // Build the WHERE clause dynamically
    const where: any = {};
    if (genre) where.genre = genre;
    if (year) where.year = year;
    if (title) where.title = { contains: title, mode: 'insensitive' };

    const skip = (page - 1) * limit; // e.g. page 2, limit 10 → skip 10

    // Run data query AND count query at the same time (parallel = faster)
    const [movies, total] = await Promise.all([
      this.prisma.movie.findMany({
        where,
        orderBy: { [sortBy]: order },
        skip,
        take: limit,
        include: {
          _count: { select: { reviews: true } }, // adds reviewsCount
        },
      }),
      this.prisma.movie.count({ where }),
    ]);

    return {
      data: movies,
      meta: {
        total,              // total matching records
        page,               // current page
        limit,              // items per page
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

 async findOne(id: string) {
  const movie = await this.prisma.movie.findUnique({ where: { id } });
  if (!movie) throw new NotFoundException(`Movie ${id} not found`);
  return movie;
}

  async findOneWithReviews(id: string) {
    return this.prisma.movie.findUnique({
      where: { id },
      select: {
        id: true, title: true, year: true, genre: true,
        reviews: {
          select: {
            id: true, rating: true, comment: true, createdAt: true,
            user: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async update(id: string, dto: UpdateMovieDto) {
    return await this.prisma.movie.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return await this.prisma.movie.delete({ where: { id } });
  }
}