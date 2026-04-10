import { Body, Controller, Post } from '@nestjs/common';
import { AiService } from './ai.service';

type AiChatRequest = {
  userId?: string;
  message?: string;
};

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  async chat(@Body() body: AiChatRequest) {
    return this.aiService.chat(body.userId, body.message);
  }
}
