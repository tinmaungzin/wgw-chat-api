import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatGateway } from './chat/chat.gateway';
import { RabbitmqService } from './rabbitmq/rabbitmq.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, ChatGateway, RabbitmqService],
})
export class AppModule {}
