import { DocumentBuilder } from "@nestjs/swagger";

export function getSwaggerConfig(){
    return new DocumentBuilder()
    .setTitle('Movie API')
    .setDescription('API для управления фильмами и отзывами')        
    .setVersion('1.0.0')
    .addTag('movies')
    .addTag('reviews')       
    .addTag('users')
    .addBearerAuth()     
    .build();
}