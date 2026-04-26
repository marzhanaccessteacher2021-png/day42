import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';


@Module({
 providers: [NotificationsService],
 exports: [NotificationsService], // экспортируем, чтобы другие модули могли использовать
})
export class NotificationsModule {}