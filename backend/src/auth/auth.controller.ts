import { Body, Controller, Post, UnauthorizedException, Res, Req } from '@nestjs/common';
import type { Response, Request } from 'express';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginUserDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    if (user instanceof UnauthorizedException) throw user;

    const tokens = await this.authService.login({ id: user.id, email: user.email });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, // set true in production with https
      path: '/auth/refresh',
    });

    return { accessToken: tokens.accessToken };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) throw new UnauthorizedException('Missing refresh token');

    const payload = this.authService.verifyToken(refreshToken);
    const user = await this.authService.findUserById(payload.sub);
    if (user instanceof UnauthorizedException || !user) throw new UnauthorizedException('User not found');

    const tokens = await this.authService.login({ id: user.id, email: user.email });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
      path: '/auth/refresh',
    });

    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('refreshToken', { path: '/auth/refresh' });
    return { ok: true };
  }
}
