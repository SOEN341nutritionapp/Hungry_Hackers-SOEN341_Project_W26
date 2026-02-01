import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import {RegisterDto} from "./dto/register.dto"
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login.dto';

@Controller('auth')
export class AuthController { 

    constructor(private readonly authService: AuthService){
        
    }

    @Post('register')
    async register(
        @Body() registerDto: RegisterDto
){
    return this.authService.register(registerDto);

}

@Post('login')
async login(
    @Body() loginDto: LoginUserDto
){

const user = await this.authService.validateUser(loginDto.email, loginDto.password);
if(user instanceof UnauthorizedException){
    throw user;
}
return this.authService.login({id: user.id, email:user.email});
}
}