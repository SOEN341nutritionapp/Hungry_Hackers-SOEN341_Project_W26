import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { MetroService } from './metro.service';
import { SyncMetroDto } from './dto/sync-metro.dto';
import { UpdateFridgeItemDto } from './dto/update-fridge-item.dto';

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

  @Patch('fridge/:id')
  async updateFridgeItem(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() body: UpdateFridgeItemDto,
  ) {
    return this.metroService.adjustFridgeItem(req.headers.authorization, id, body);
  }

  @Delete('fridge/:id')
  async deleteFridgeItem(@Req() req: Request, @Param('id') id: string) {
    return this.metroService.removeFridgeItem(req.headers.authorization, id);
  }
}
