import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { MoviesService } from './movies.service';
import { MovieModel } from './models/movie.model';
import { Public } from 'src/auth/decorators/public.decorator';

@Resolver(() => MovieModel)
export class MoviesResolver {
  constructor(private readonly moviesService: MoviesService) {}

  @Public()
  // query { movies { id title year genre } }
  @Query(() => [MovieModel], { name: 'movies' })
  async findAll() {
    const result = await this.moviesService.findAll({});
    return result.data; // достаём массив из { data, meta }
  }

  @Public()
  // query { movie(id: "...") { id title year } }
  @Query(() => MovieModel, { name: 'movie' })
  findOne(@Args('id', { type: () => ID }) id: string) {
    return this.moviesService.findOne(id); // reuses your existing service!
  }

  
}

