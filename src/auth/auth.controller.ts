import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { User } from '../entities/User';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // -------------------- LOCAL REGISTRATION --------------------
  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<User> {
    return this.authService.register(dto);
  }
}
