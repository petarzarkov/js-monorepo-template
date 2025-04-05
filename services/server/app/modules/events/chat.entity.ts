import { IsNotEmpty, IsString } from 'class-validator';

export class ChatMessage {
  @IsNotEmpty()
  @IsString()
  nickname: string;
  @IsNotEmpty()
  @IsString()
  message: string;
}
