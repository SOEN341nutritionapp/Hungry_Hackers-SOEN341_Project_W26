import { Body, Controller, Post } from '@nestjs/common';

@Controller('metro')
export class MetroController {
  @Post('sync')
  sync(@Body() body: any) {
    const items = Array.isArray(body?.items) ? body.items : [];
    console.log('[METRO SYNC] received', { count: items.length, sample: items.slice(0, 3) });
    return { ok: true, count: items.length, receivedSample: items.slice(0, 3) };
  }
}
