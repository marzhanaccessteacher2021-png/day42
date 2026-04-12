import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateReviewDto {
  @ApiProperty({ description: 'Рейтинг фильма от 1 до 10', example: 7 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  rating?: number;

  @ApiProperty({ description: 'Комментарий к фильму', example: 'Пересмотрел — мнение изменилось' })
  @IsOptional()
  @IsString()
  comment?: string;

  // movieId — нельзя менять фильм у существующего отзыва
  // userId  — нельзя менять владельца отзыва
}