import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginRequest {

  @IsEmail({}, { message: 'Некорректный email' })
  @IsNotEmpty({ message: 'Email не может быть пустым' })
  @IsString({ message: 'Email должен быть строкой' })
  email: string;

  @IsNotEmpty({ message: 'Пароль не может быть пустым' })
  @IsString({ message: 'Пароль должен быть строкой' })
  @MinLength(6, { message: 'Пароль должен быть не менее 6 символов' })
  @MaxLength(50, { message: 'Пароль должен быть не более 50 символов' })
  password: string;
}
