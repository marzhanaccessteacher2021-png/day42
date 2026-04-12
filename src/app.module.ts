// src/app.module.ts
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { MoviesModule } from './movies/movies.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './auth/guards/roles.guard';
import { JwtGuard } from './auth/guards/auth.guard';

import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

import { join } from 'path';
import { FileModule } from './file/file.module';
import { ServeStaticModule } from '@nestjs/serve-static';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'schema.gql'), // убрать 'src/' // code-first approach
      playground: true,
      sortSchema: true, // enables the GraphQL playground at /graphql
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),

      serveRoot: '/static', // files will be served at /static/filename
    }),
    PrismaModule,
    UsersModule,
    MoviesModule,
    ReviewsModule,
    AuthModule,
    FileModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtGuard, // protects ALL routes by default
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard, // checks @Roles() on routes
    },
  ],
})
export class AppModule {}
