import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ExtensionAuthService } from './extension-auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // adjust path to your project

class CreateExtensionSessionDto {
  label?: string;
}

@Controller('extension')
export class ExtensionAuthController {
  constructor(private readonly service: ExtensionAuthService) {}

  @UseGuards(JwtAuthGuard)
  @Post('session')
  async create(@Req() req: any, @Body() dto: CreateExtensionSessionDto) {
    // Adjust depending on what your Jwt strategy sets:
    const userId = req.user?.id ?? req.user?.sub;
    return this.service.createExtensionSession({
      userId,
      label: dto.label,
      userAgent: req.headers['user-agent'],
    });
  }
}
