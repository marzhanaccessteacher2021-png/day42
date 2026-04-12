
import { IsEnum, IsInt, IsIn, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Genre } from 'src/generated/prisma/enums'; 

export class QueryMoviesDto {
  // --- PAGINATION ---
  @IsOptional()
  @Type(() => Number)   // converts query string "2" → number 2
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  // --- FILTERING ---
  @IsOptional()
  @IsEnum(Genre)        // only valid genres accepted (ACTION, COMEDY, etc.)
  genre?: Genre;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @IsOptional()
  @IsString()
  title?: string;

  // --- SORTING ---
  @IsOptional()
  @IsIn(['title', 'year', 'createdAt'])
  sortBy?: 'title' | 'year' | 'createdAt' = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';
}