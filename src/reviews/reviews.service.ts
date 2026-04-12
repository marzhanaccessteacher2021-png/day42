import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Role } from 'src/auth/enums/role.enum';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  // userId comes from the JWT, NOT from the request body
  async create(dto: CreateReviewDto, userId: string) {
    return await this.prisma.review.create({
      data: {
        rating: dto.rating,
        comment: dto.comment,
        movieId: dto.movieId,
        userId,
      },
    });
  }

  async findAll() {
    return await this.prisma.review.findMany({
      include: {
        user: { select: { id: true, name: true } },
        movie: { select: { id: true, title: true } },
      },
    });
  }

  async findOne(id: string) {
    return await this.prisma.review.findUnique({ where: { id } });
  }

  async findByMovieId(movieId: string) {
    return await this.prisma.review.findMany({
      where: { movieId },
      include: {
        user: { select: { id: true, name: true } },
        movie: { select: { id: true, title: true } },
      },
    });
  }

  async update(id: string, dto: UpdateReviewDto, userId: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });

    if (!review) throw new NotFoundException('Отзыв не найден');

    // Only the owner can edit their review
    if (review.userId !== userId) {
      throw new ForbiddenException('Вы можете редактировать только свой отзыв');
    }

    return await this.prisma.review.update({ where: { id }, data: dto });
  }

  async remove(id: string, userId: string, userRole: Role) {
    const review = await this.prisma.review.findUnique({ where: { id } });

    if (!review) throw new NotFoundException('Отзыв не найден');

    // Admins can delete any review; regular users only their own
    if (userRole !== Role.ADMIN && review.userId !== userId) {
      throw new ForbiddenException('Вы можете удалять только свои отзывы');
    }

    return await this.prisma.review.delete({ where: { id } });
  }
}