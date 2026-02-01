import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginUserDTO } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {

    constructor(private prisma: PrismaService){}

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

    async login(user: LoginUserDTO){

    }
}
