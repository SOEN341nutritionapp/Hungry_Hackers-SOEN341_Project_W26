import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt'

@Injectable()
export class UsersService {
  constructor(private prisma:PrismaService) {}

  // This function will handle the "Editing" logic
  async updateAccount(userId: string, updateData: any) {

    // 1. Identify updateable fields (Email, Password, Dietary Prefs)
    const allowed: { email?: string; name?: string; password?: string } = {};

    if (updateData?.email !== undefined) allowed.email = updateData.email;
    if (updateData?.name !== undefined) allowed.name = updateData.name;

    // 2. Ignore non-updateable fields (id, createdAt) per Prisma Schema
    const forbiddenFields = ['id', 'createdAt', 'updatedAt'];
    for (const f of forbiddenFields){
      if(updateData?.[f] !== undefined) {
        throw new BadRequestException(`${f} cannot be modified`);
      }
    }

    // 3. Hash password if it's being changed
    if (updateData?.password !== undefined){
      const saltRounds = 10;
      allowed.password = await bcrypt.hash(updateData.password, saltRounds);
    }
    
    // i fnothing valid was provided, stop
    if (Object.keys(allowed).length === 0) {
      throw new BadRequestException('No valid fields provided to update');
    }

    // 4. Call Prisma to save changes
    return this.prisma.user.update({
      where: { id: userId },
      data: allowed,
      select:{
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}