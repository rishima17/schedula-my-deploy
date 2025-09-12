import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '../entities/User';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // Called by GoogleStrategy: find or create user
  async validateOAuthLogin(email: string, name: string, role: 'doctor' | 'patient') {
    let user = await this.usersService.findByEmail(email);
    if (!user) {
      user = await this.usersService.createUser(name, email, role);
    }
    // optionally: you could update role if mismatched, but be careful with security
    return user;
  }

  async login(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const access_token = this.jwtService.sign(payload);
    return { access_token, user };
  }
}
