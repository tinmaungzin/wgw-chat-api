import { Injectable } from '@nestjs/common';
import * as amqp from 'amqp-connection-manager';
import { ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';

@Injectable()
export class RabbitmqService {
  private connection: amqp.AmqpConnectionManager;
  private channel: ChannelWrapper;

  constructor() {
    this.connection = amqp.connect(['amqp://user:password@rabbitmq:5672']);
    this.channel = this.connection.createChannel({
      json: true,
      setup: async (channel: ConfirmChannel) => {
        try {
          await channel.assertExchange('chat_exchange', 'direct', {
            durable: true,
          });
          console.log('Exchange setup completed');
        } catch (err) {
          console.error('Error setting up exchange', err);
        }
      },
    });
  }

  async createQueue(queueName: string) {
    try {
      await this.channel.addSetup(async (channel: ConfirmChannel) => {
        await channel.assertQueue(queueName, { durable: true });
        await channel.bindQueue(queueName, 'chat_exchange', queueName);
        console.log(`Queue ${queueName} created and bound to exchange`);
      });
    } catch (err) {
      console.error(`Error creating queue ${queueName}`, err);
    }
  }

  async deleteQueue(queueName: string) {
    try {
      await this.channel.addSetup(async (channel: ConfirmChannel) => {
        await channel.deleteQueue(queueName);
        console.log(`Queue ${queueName} deleted`);
      });
    } catch (err) {
      console.error(`Error deleting queue ${queueName}`, err);
    }
  }

  async sendToQueue(queueName: string, message: any) {
    try {
      await this.channel.publish('chat_exchange', queueName, message);
      console.log(`Message sent to queue ${queueName}:`, message);
    } catch (err) {
      console.error(`Error sending message to queue ${queueName}`, err);
    }
  }

  async consumeQueue(queueName: string, callback: (msg: any) => void) {
    try {
      await this.channel.addSetup((channel: ConfirmChannel) => {
        channel.consume(queueName, (msg: any) => {
          if (msg !== null) {
            callback(JSON.parse(msg.content.toString()));
            channel.ack(msg);
          }
        });
      });
      console.log(`Consuming messages from queue ${queueName}`);
    } catch (err) {
      console.error(`Error consuming messages from queue ${queueName}`, err);
    }
  }
}
