import { Body, Controller, Post, Get, Patch, UnauthorizedException, Res, Req } from '@nestjs/common';
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

    const tokens = await this.authService.login({ id: (user as any).id, email: (user as any).email });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false, 
      path: '/auth/refresh',
    });

    //Sends user info back to React immediately
    return { 
      accessToken: tokens.accessToken,
      user: {
        id: (user as any).id,
        name: (user as any).name,
        email: (user as any).email
      }
    };
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

    const tokens = await this.authService.login({ id: (user as any).id, email: (user as any).email });

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

  // Get user profile information
  @Get('profile')
  async getProfile(@Req() req: Request) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) throw new UnauthorizedException('No token');
    
    const token = authHeader.split(' ')[1];
    try {
      const payload = this.authService.verifyToken(token);
      const user = await this.authService.findUserById(payload.sub) as any;
      
      if (!user) throw new UnauthorizedException('User not found');

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        dietaryPreferences: user.dietaryPreferences || [],
        allergies: user.allergies || [],
        sex: user.sex,
        heightCm: user.heightCm,
        weightKg: user.weightKg,
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }

//update user profile information
@Patch('profile')
async updateProfile(@Req() req: Request, @Body() updates: any) {

  const authHeader = req.headers['authorization'];
  if (!authHeader) throw new UnauthorizedException('No token');
  
  const token = authHeader.split(' ')[1];
  
  try {
    const payload = this.authService.verifyToken(token);
    
    return await this.authService.updateUser(payload.sub, updates);
  } catch (e) {
    throw new UnauthorizedException('Invalid token or update failed');
  }
}

}

