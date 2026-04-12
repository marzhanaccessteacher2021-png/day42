import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Genre } from 'src/generated/prisma/enums';

export class CreateMovieDto {
  @ApiProperty({ description: 'Название фильма', example: 'Inception' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Описание фильма', example: 'Фильм о снах и реальности' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Год выпуска фильма', example: 2010 })
  @IsInt()
  @Min(1888) // The year the first movie was made
  @Max(new Date().getFullYear()) // Current year
  year: number;

  @ApiProperty({ description: 'Жанр фильма', enum: Genre })
  @IsEnum(Genre)
  genre: Genre;
}
