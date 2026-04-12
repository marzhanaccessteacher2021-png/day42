import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Authorization } from 'src/auth/decorators/authorization.decorator';
import { Authorized } from 'src/auth/decorators/authorized.decorator';
import { Role } from 'src/auth/enums/role.enum';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @ApiOperation({ summary: 'Создание отзыва' })
  @ApiResponse({ status: 201, description: 'Отзыв успешно создан.' })
  @Authorization()
  @Post()
  create(
    @Body() dto: CreateReviewDto,
    @Authorized('id') userId: string, // ← из JWT
  ) {
    return this.reviewsService.create(dto, userId);
  }

  @ApiOperation({ summary: 'Получение всех отзывов' })
  @Get()
  findAll() {
    return this.reviewsService.findAll();
  }

  @ApiOperation({ summary: 'Получение отзывов по ID фильма' })
  @Get('movie/:movieId')
  findByMovieId(@Param('movieId') movieId: string) {
    return this.reviewsService.findByMovieId(movieId);
  }

  @ApiOperation({ summary: 'Получение отзыва по ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @ApiOperation({ summary: 'Редактирование своего отзыва' })
  @ApiResponse({
    status: 403,
    description: 'Нельзя редактировать чужой отзыв.',
  })
  @Authorization()
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
    @Authorized('id') userId: string, // ← из JWT
  ) {
    return this.reviewsService.update(id, dto, userId);
  }

  @ApiOperation({ summary: 'Удаление отзыва' })
  @ApiResponse({ status: 403, description: 'Нельзя удалить чужой отзыв.' })
  @Authorization()
  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Authorized('id') userId: string, // ← из JWT
    @Authorized('role') userRole: Role, // ← из JWT
  ) {
    return this.reviewsService.remove(id, userId, userRole);
  }
}
