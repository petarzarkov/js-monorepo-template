import { UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatMessage } from './chat.entity';
import { WebsocketsExceptionFilter } from './events.filter';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@UseFilters(new WebsocketsExceptionFilter())
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('chat')
  @UsePipes(new ValidationPipe())
  handleMessage(
    @MessageBody() message: ChatMessage,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @ConnectedSocket() _client: Socket,
  ) {
    this.server.emit('chat', {
      ...message,
      time: new Date().toDateString(),
    });
  }
}
