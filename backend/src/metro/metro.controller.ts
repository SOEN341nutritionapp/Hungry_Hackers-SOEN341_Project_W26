import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { MetroService } from './metro.service';
import { SyncMetroDto } from './dto/sync-metro.dto';

@Controller('metro')
export class MetroController {
  constructor(private readonly metroService: MetroService) {}

  @Post('sync')
  async sync(@Req() req: Request, @Body() body: SyncMetroDto) {
    return this.metroService.syncFridgeItems(req.headers.authorization, body.items);
  }

  @Get('fridge')
  async getFridge(@Req() req: Request) {
    return this.metroService.getFridgeItems(req.headers.authorization);
  }
}
