import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { RabbitmqService } from 'src/rabbitmq/rabbitmq.service';

@WebSocketGateway({ cors: { origin: '*' }, namespace: 'chat' })
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('ChatGateway');

  constructor(private rabbitmqService: RabbitmqService) {}

  afterInit() {
    this.logger.log('ChatGateway initialized');
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    await this.rabbitmqService.createQueue(client.id);
    await this.rabbitmqService.sendToQueue(client.id, {
      recipient: client.id,
      sender: client.id,
      message: `Your id is - ${client.id}`,
    });
    this.rabbitmqService.consumeQueue(client.id, (message) => {
      client.emit('message', message);
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.rabbitmqService.deleteQueue(client.id);
  }

  @SubscribeMessage('message')
  async handleMessage(
    client: Socket,
    payload: { recipient: string; sender: string; message: string },
  ): Promise<void> {
    await this.rabbitmqService.sendToQueue(payload.recipient, payload);
  }
}
