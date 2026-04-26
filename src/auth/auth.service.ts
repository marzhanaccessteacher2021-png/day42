import {
 ConflictException,
 Injectable,
 NotFoundException,
 UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterRequest } from './dto/register.dto';
import { hash, verify } from 'argon2';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { LoginRequest } from './dto/login.dto';
import type { Request, Response } from 'express';
import { isDev } from 'src/utils/is-dev-utils';
import { JwtPayload } from './interfaces/jwt.interface';
import { NotificationsService } from 'src/notifications/notifications.service'; // 👈 добавили


@Injectable()
export class AuthService {
 private readonly JWT_ACCESS_TOKEN_TTL: string;
 private readonly JWT_REFRESH_TOKEN_TTL: string;
 private readonly COOKIE_DOMAIN: string;


 constructor(
   private readonly prisma: PrismaService,
   private readonly configService: ConfigService,
   private readonly jwtService: JwtService,
   private readonly notifications: NotificationsService, // 👈 добавили
 ) {
   this.JWT_ACCESS_TOKEN_TTL = this.configService.getOrThrow<string>(
     'JWT_ACCESS_TOKEN_TTL',
   );
   this.JWT_REFRESH_TOKEN_TTL = this.configService.getOrThrow<string>(
     'JWT_REFRESH_TOKEN_TTL',
   );
   this.COOKIE_DOMAIN = this.configService.getOrThrow<string>('COOKIE_DOMAIN');
 }


 async register(res: Response, dto: RegisterRequest) {
   const { email, name, password } = dto;


   const existingUser = await this.prisma.user.findUnique({
     where: { email },
   });
   if (existingUser) {
     throw new ConflictException('Пользователь с таким email уже существует');
   }


   const user = await this.prisma.user.create({
     data: {
       email,
       name,
       password: await hash(password),
     },
   });


   // 👇 Отправляем welcome-письмо через n8n (не блокирует ответ)
   this.notifications.sendWelcomeEmail({ email, name });


   return this.auth(res, user.id);
 }


 async login(res: Response, dto: LoginRequest) {
   const { email, password } = dto;
   const user = await this.prisma.user.findUnique({
     where: { email },
     select: { id: true, password: true },
   });


   if (!user) {
     throw new NotFoundException('Пользователь с таким email не найден');
   }


   const isValidPassword = await verify(user.password, password);


   if (!isValidPassword) {
     throw new NotFoundException('Неверный пароль');
   }
   return this.auth(res, user.id);
 }


 async refresh(req: Request, res: Response) {
   const refreshToken = req.cookies['refreshToken'];


   if (!refreshToken) {
     throw new UnauthorizedException('Отсутствует refresh token');
   }


   const payload: JwtPayload = await this.jwtService.verifyAsync(refreshToken);


   if (payload) {
     const user = await this.prisma.user.findUnique({
       where: { id: payload.id },
       select: { id: true },
     });


     if (!user) {
       throw new NotFoundException('Пользователь не найден');
     }


     return this.auth(res, user.id);
   }
 }


 async logout(res: Response) {
   this.setCookie(res, '', new Date(0));
   return { message: 'Вы успешно вышли из аккаунта' };
 }


 async validateUser(id: string) {
   const user = await this.prisma.user.findUnique({
     where: { id },
     select: { id: true, role: true },
   });
   if (!user) throw new NotFoundException('Пользователь не найден');
   return user;
 }


 private auth(res: Response, id: string) {
   const { accessToken, refreshToken } = this.generateTokens(id);
   this.setCookie(
     res,
     refreshToken,
     new Date(60 * 60 * 24 * 1000 + Date.now()),
   );
   return { accessToken };
 }


 private generateTokens(id: string) {
   const payload = { id };


   const accessToken = this.jwtService.sign(payload, {
     expiresIn: this.JWT_ACCESS_TOKEN_TTL as unknown as any,
   });
   const refreshToken = this.jwtService.sign(payload, {
     expiresIn: this.JWT_REFRESH_TOKEN_TTL as unknown as any,
   });


   return { accessToken, refreshToken };
 }


 private setCookie(res: Response, token: string, expires: Date) {
   res.cookie('refreshToken', token, {
     expires,
     httpOnly: true,
     domain: this.COOKIE_DOMAIN,
     secure: !isDev(this.configService),
     sameSite: !isDev(this.configService) ? 'none' : 'lax',
   });
 }


 async getMyReviews(userId: string) {
   return this.prisma.review.findMany({
     where: {
       userId: userId,
     },
   });
 }
}
