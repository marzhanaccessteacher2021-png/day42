import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";

export class RegisterRequest{
    @ApiProperty({ description: 'Email', example: 'user@example.com' })
    @IsEmail({}, {message: 'Некорректный email'})
    @IsNotEmpty({message: 'Email не может быть пустым'})
    @IsString({message: 'Email должен быть строкой'})
    email: string;


    @ApiProperty({ description: 'Имя', example: 'Иван Иванов', minLength: 2, maxLength: 50 })
    @IsNotEmpty({message: 'Имя не может быть пустым'})
    @IsString({message: 'Имя должно быть строкой'})
    @MinLength(2, {message: 'Имя должно быть не менее 2 символов'})
    @MaxLength(50, {message: 'Имя должно быть не более 50 символов'})
    name: string;

    @ApiProperty({ description: 'Пароль', example: 'password123', minLength: 6, maxLength: 50 })
    @IsNotEmpty({message: 'Пароль не может быть пустым'})
    @IsString({message: 'Пароль должен быть строкой'})
    @MinLength(6, {message: 'Пароль должен быть не менее 6 символов'})
    @MaxLength(50, {message: 'Пароль должен быть не более 50 символов'})
    password: string;
}