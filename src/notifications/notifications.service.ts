import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';


@Injectable()
export class NotificationsService {
 private readonly logger = new Logger(NotificationsService.name);


 constructor(private readonly configService: ConfigService) {}


 // Вызывается при регистрации пользователя
 async sendWelcomeEmail(data: { email: string; name: string }): Promise<void> {
   const webhookUrl = this.configService.get<string>(
     'N8N_WEBHOOK_REGISTER_URL',
   );


   if (!webhookUrl) {
     this.logger.warn(
       'N8N_WEBHOOK_REGISTER_URL не задан — уведомление пропущено',
     );
     return;
   }


   try {
     await fetch(webhookUrl, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         email: data.email,
         name: data.name,
         event: 'user_registered',
         timestamp: new Date().toISOString(),
       }),
     });
     this.logger.log(`Welcome email отправлен на ${data.email}`);
   } catch (error) {
     // Уведомление не блокирует регистрацию — просто логируем ошибку
     this.logger.error('Не удалось отправить welcome email', error);
   }
 }


 // Вызывается при создании отзыва
 async sendReviewNotification(data: {
   userEmail: string;
   userName: string;
   movieTitle: string;
   rating: number;
   comment?: string;
 }): Promise<void> {
   const webhookUrl = this.configService.get<string>('N8N_WEBHOOK_REVIEW_URL');


   if (!webhookUrl) {
     this.logger.warn(
       'N8N_WEBHOOK_REVIEW_URL не задан — уведомление пропущено',
     );
     return;
   }


   try {
     await fetch(webhookUrl, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         userEmail: data.userEmail,
         userName: data.userName,
         movieTitle: data.movieTitle,
         rating: data.rating,
         comment: data.comment ?? '',
         event: 'review_created',
         timestamp: new Date().toISOString(),
       }),
     });
     this.logger.log(`Review notification отправлен на ${data.userEmail}`);
   } catch (error) {
     this.logger.error('Не удалось отправить review notification', error);
   }
 }
}
