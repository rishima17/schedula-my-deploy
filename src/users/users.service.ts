import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/User';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async createUser(
    name: string,
    email: string,
    role: 'doctor' | 'patient',
    password: string | null = null,
    provider: string = 'google',
  ): Promise<User> {
    const user = this.userRepository.create({
      name,
      email,
      role,
      password,
      provider,
    });
    return this.userRepository.save(user);
  }
}
