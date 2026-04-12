
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class MovieModel {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => Int)
  year: number;

  @Field()
  genre: string;
}

