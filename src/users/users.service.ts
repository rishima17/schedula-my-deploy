import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/User';
import { Doctor } from '../entities/Doctor';
import { Patient } from '../entities/Patient';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Doctor)
    private doctorRepository: Repository<Doctor>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
  ) {}

  async createUser(
    name: string,
    email: string,
    role: 'doctor' | 'patient',
    password: string | null = null,
    provider: string = 'google',
    doctorData?: Partial<Doctor>,   // Partial avoids TS strict type errors
    patientData?: Partial<Patient>,
  ): Promise<User> {
    // 1️⃣ Create User
    const newUser = this.userRepository.create({
      name,
      email,
      role,
      password,
      provider,
    });
    await this.userRepository.save(newUser);

    // 2️⃣ If role = doctor → create Doctor row
    if (role === 'doctor') {
      const doctor = this.doctorRepository.create({
        user: newUser,
        specialization: doctorData?.specialization ?? '',
        experience: doctorData?.experience ?? 0,
        scheduleType: doctorData?.scheduleType ?? 'wave',
        consultingStart: doctorData?.consultingStart ?? '09:00',
        consultingEnd: doctorData?.consultingEnd ?? '16:00',
        slotDuration: doctorData?.slotDuration ?? 30,
        capacityPerSlot: doctorData?.capacityPerSlot ?? 1,
        dailyCapacity: doctorData?.dailyCapacity ?? 20,
      });
      await this.doctorRepository.save(doctor);
    }

    // 3️⃣ If role = patient → create Patient row
    if (role === 'patient') {
      const patient = this.patientRepository.create({
        user: newUser,
        age: patientData?.age ?? 0,             // default age 0 if not provided
        gender: patientData?.gender ?? null,    // optional
        medicalHistory: patientData?.medicalHistory ?? '',
        onboardingStep: 1,
        isVerified: false,                       // OTP verification pending
      });
      await this.patientRepository.save(patient);
    }

    return newUser;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }
}
