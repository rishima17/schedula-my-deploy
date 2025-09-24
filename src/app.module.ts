import * as dotenv from 'dotenv';
import { join } from 'path';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// Load environment variables immediately
dotenv.config({
  path: join(
    __dirname,
    '..',
    process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development'
  ),
});

console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DATABASE_URL:', process.env.DATABASE_URL);

// Entities
import { User } from './entities/User';
import { Patient } from './entities/Patient';
import { Doctor } from './entities/Doctor';
import { OnboardingProgress } from './entities/onboarding-progress.entity';
import { Appointment } from './entities/Appointment';
import { Availability } from './entities/Availability';

// Feature modules
import { VerificationModule } from './verification/verification.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { AppointmentModule } from './appointments/appointment.module';
import { DoctorModule } from './doctor/doctor.module';
import { AuthModule } from './auth/auth.module';
import { AvailabilityModule } from './availability/availability.module';

@Module({
  imports: [
    // ConfigModule now just makes env globally accessible
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // TypeORM configuration
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [
        User,
        Patient,
        Doctor,
        OnboardingProgress,
        Appointment,
        Availability,
      ],
      synchronize: process.env.NODE_ENV === 'development', // auto sync only in dev
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false, // enable SSL only for Render
    }),

    // Feature modules
    AuthModule,
    VerificationModule,
    OnboardingModule,
    DoctorModule,
    AppointmentModule,
    AvailabilityModule,
  ],
})
export class AppModule {}