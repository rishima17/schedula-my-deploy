import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

// entities
import { User } from './entities/User';
import { Patient } from './entities/Patient';
import { Doctor } from './entities/Doctor';
import { OnboardingProgress } from './entities/onboarding-progress.entity';
import { Appointment } from './entities/Appointment';
import { Availability } from './entities/Availability';

// feature modules
import { VerificationModule } from './verification/verification.module';
import { OnboardingModule } from './onboarding/onboarding.module';
import { AppointmentModule } from './appointments/appointment.module';
import { DoctorModule } from './doctor/doctor.module';
import { AuthModule } from './auth/auth.module';
import { AvailabilityModule } from './availability/availability.module';

// root controller
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [User, Patient, Doctor, OnboardingProgress, Appointment, Availability],
      synchronize: true,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    }),
    AuthModule,
    VerificationModule,
    OnboardingModule,
    DoctorModule,
    AppointmentModule,
    AvailabilityModule,
  ],
  controllers: [AppController], // ✅ add this line
})
export class AppModule {}
