import { Module } from '@nestjs/common';
import { MoviesService } from './movies.service';
import { MoviesController } from './movies.controller';
import { MoviesResolver } from './movies.resolver';

@Module({
  controllers: [MoviesController],
  providers: [MoviesService, MoviesResolver],
})
export class MoviesModule {}
