import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { UpdateProfileDto } from './dto/update-profile.dto';

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

  
  async updateProfile(userId: string, updateData: UpdateProfileDto) {
    const allowed: any = {};

    if (updateData.dateOfBirth !== undefined) allowed.dateOfBirth = new Date(updateData.dateOfBirth);
    if (updateData.sex !== undefined) allowed.sex = updateData.sex;
    if (updateData.heightCm !== undefined) allowed.heightCm = updateData.heightCm;
    if (updateData.weightKg !== undefined) allowed.weightKg = updateData.weightKg;
    if (updateData.allergies !== undefined) allowed.allergies = updateData.allergies;
    if (updateData.dietaryPreferences !== undefined) allowed.dietaryPreferences = updateData.dietaryPreferences;

    // If nothing valid was provided, stop
    if (Object.keys(allowed).length === 0) {
      throw new BadRequestException('No valid fields provided to update');
    }

    // Update in database
    return this.prisma.user.update({
      where: { id: userId },
      data: allowed,
      select: {
        id: true,
        email: true,
        name: true,
        dateOfBirth: true,
        sex: true,
        heightCm: true,
        weightKg: true,
        allergies: true,
        dietaryPreferences: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}