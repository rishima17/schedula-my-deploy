import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { Appointment } from '../entities/Appointment';
import { Patient } from '../entities/Patient';
import { Doctor } from '../entities/Doctor';
import { Availability } from '../entities/Availability';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Patient, Doctor, Availability])],
  controllers: [AppointmentController],
  providers: [AppointmentService],
  exports: [AppointmentService], // ✅ Export if needed in other modules
})
export class AppointmentModule {}
