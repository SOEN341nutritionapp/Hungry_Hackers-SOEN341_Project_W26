import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginUserDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {

    constructor(private prisma: PrismaService, private jwtService:JwtService){}

    async register(registerDto: RegisterDto){
        const{email, password, name} = registerDto;

        const existingUser = await this.prisma.user.findUnique({
        where: { email },
    });
    if (existingUser){
        throw new Error('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

        const user = await this.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
            },
        });
        const {password: _, ...result }=user;
        return result;
    }

    async validateUser(email:string, password: string){
        const user =await this.prisma.user.findUnique({
            where:{email},
        });
        if(!user){
            return new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if(!isPasswordValid){
            throw new  UnauthorizedException('Invalid email or password');
    }

    const {password: _, ...result}=user;
    return result;

}

    async login(user: any) { 
        const payload = { sub: user.id, email: user.email };
        const accessToken = this.jwtService.sign(payload, { expiresIn: '1h' });
        const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

        return {
            accessToken,
            refreshToken,
            user: { 
                id: user.id, 
                email: user.email,
                name: user.name 
            }
        };
    }

    async findUserById(id: string) {
        const user = await this.prisma.user.findUnique({
            where: { id },
        });
        if (!user) {
            return new UnauthorizedException('User not found');
        }

        const { password: _, ...result } = user;
        return result;
    }
    
verifyToken(token: string) {
  try {
    return this.jwtService.verify(token, {
      secret: process.env.JWT_SECRET,
    });
  } catch (error) {
    throw new UnauthorizedException('Invalid token');
  }
}

async updateUser(id: string, data: { name?: string; dietaryPreferences?: string[]; allergies?: string[] }) {
  const user = await this.prisma.user.update({
    where: { id },
    data: {
      name: data.name,
      dietaryPreferences: data.dietaryPreferences,
      allergies: data.allergies,
    },
  });

  const { password: _, ...result } = user;
  return result;
}
    
}
