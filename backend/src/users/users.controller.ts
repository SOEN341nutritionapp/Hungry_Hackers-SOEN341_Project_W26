import { Controller, Patch, Param, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // PATCH /users/:id/profile
  @Patch(':id/profile')
  async updateProfile(
    @Param('id') userId: string,
    @Body() body: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, body);
  }
}
