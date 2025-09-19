import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
import { Appointment } from "../entities/Appointment";
import { Patient } from '../entities/Patient';
import { Doctor } from '../entities/Doctor';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Patient, Doctor])],
  controllers: [AppointmentController],
  providers: [AppointmentService],
})
export class AppointmentModule {}
