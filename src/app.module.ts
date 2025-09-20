import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

import { User } from './entities/User';
import { Patient } from './entities/Patient';
import { Doctor } from './entities/Doctor';
import { OnboardingProgress } from './entities/onboarding-progress.entity';
import { Appointment } from './entities/Appointment';
import { Availability } from './entities/Availability';

import { VerificationModule } from './verification/verification.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { AppointmentModule } from './appointments/appointment.module';
import { DoctorModule } from './doctor/doctor.module';
import { AuthModule } from './auth/auth.module';
import { AvailabilityModule } from './availability/availability.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL, // ✅ use Render’s env var
      entities: [
        User,
        Patient,
        Doctor,
        OnboardingProgress,
        Appointment,
        Availability,
      ],
      synchronize: true, // ⚠️ safe for dev, but disable in prod
      ssl: process.env.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false, // ✅ important for Render Postgres
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
