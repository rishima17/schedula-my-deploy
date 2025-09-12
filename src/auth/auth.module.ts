import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { User } from '../entities/User';
import { Doctor } from '../entities/Doctor';
import { Patient } from '../entities/Patient';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './google.strategy';
import { GoogleAuthGuard } from './google-auth.guard';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '1h' },
    }),
    TypeOrmModule.forFeature([User, Doctor, Patient]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UsersService,
    GoogleStrategy,
    GoogleAuthGuard,
    JwtStrategy,
    RolesGuard,
    Reflector,
  ],
  exports: [AuthService],
})
export class AuthModule {}
