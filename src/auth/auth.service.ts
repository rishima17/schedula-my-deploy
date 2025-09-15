import { Injectable, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { User } from '../entities/User';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  // -------------------- LOCAL REGISTRATION --------------------
  async register(dto: RegisterDto): Promise<User> {
    const existingUser = await this.usersService.findByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.usersService.createUser(
      dto.name,
      dto.email,
      dto.role,
      hashedPassword,
      'local',
    );

    return user;
  }
}
