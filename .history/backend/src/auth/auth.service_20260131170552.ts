import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {

    constructor(private prisma: PrismaService){}

    async register(registerDto: RegisterDto){
        const{email, password, name} = registerDto;
        const user = await this.prisma.user.create({
            data: {
                email,
                password,
                name,
            },
        });
        return user;
    }

}
