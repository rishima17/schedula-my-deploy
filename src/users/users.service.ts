import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/User';
import { Doctor } from '../entities/Doctor';
import { Patient } from '../entities/Patient';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Doctor) private doctorsRepo: Repository<Doctor>,
    @InjectRepository(Patient) private patientsRepo: Repository<Patient>,
  ) {}

  async findByEmail(email: string) {
    return this.usersRepo.findOne({
      where: { email },
      relations: ['doctor', 'patient'],
    });
  }

  async createUser(name: string, email: string, role: 'doctor' | 'patient') {
    const user = this.usersRepo.create({
      name,
      email,
      role,
      provider: 'google',
      password: null,
    });
    await this.usersRepo.save(user);

    if (role === 'doctor') {
      const doctor = this.doctorsRepo.create({
        specialization: '',
        experience: 0,
        user,
      });
      await this.doctorsRepo.save(doctor);
    } else {
      const patient = this.patientsRepo.create({
        age: 0,
        medicalHistory: '',
        user,
      });
      await this.patientsRepo.save(patient);
    }

    return this.findByEmail(email);
  }
}
