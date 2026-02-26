import { Injectable } from '@nestjs/common';
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
                password,
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
            return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if(!isPasswordValid){
        return null;
    }

    const {password: _, ...result}=user;
    return result;

}

    async login(user: {id:string, email: string}){
        const payload = {sub: user.id, email: user.email};
        const accessToken = this.jwtService.sign(payload, {expiresIn: '1h'} );

        const refreshToken = this.jwtService.sign(payload, {expiresIn: '7d', })

        return{
            accessToken,
            refreshToken
        }
    }
}
