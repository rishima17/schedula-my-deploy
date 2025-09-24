import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { Appointment } from "../entities/Appointment";
import { Patient } from '../entities/Patient';
import { Doctor } from '../entities/Doctor';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private readonly apptRepo: Repository<Appointment>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,
  ) {}

  async listDoctors() {
    return this.doctorRepo.find();
  }

  async getAvailableSlots(doctorId: number, date: string) {
    const doctor = await this.doctorRepo.findOne({ where: { id: doctorId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const day = new Date(date);
    if (isNaN(day.getTime())) throw new BadRequestException('Invalid date format');

    return this.generateFixedSlots(doctor, day);
  }

  // 🔹 Generate fixed 15-minute (slotDuration) slots
  private async generateFixedSlots(doctor: Doctor, day: Date) {
    const slots: { time: string; available: number }[] = [];
    const [startHour, startMin] = doctor.consultingStart.split(':').map(Number);
    const [endHour, endMin] = doctor.consultingEnd.split(':').map(Number);

    const start = new Date(day);
    start.setHours(startHour, startMin, 0, 0);
    const end = new Date(day);
    end.setHours(endHour, endMin, 0, 0);

    for (let t = new Date(start); t < end; t.setMinutes(t.getMinutes() + doctor.slotDuration)) {
      const slotStart = new Date(t);
      slotStart.setSeconds(0, 0);

      const booked = await this.apptRepo.count({
        where: { doctorId: doctor.id, slot: slotStart, status: 'confirmed' },
      });

      slots.push({
        time: slotStart.toISOString(),
        available: booked === 0 ? 1 : 0, // free or taken
      });
    }

    return slots;
  }

  async confirmAppointment(dto: CreateAppointmentDto) {
    const { patientId, doctorId, slot } = dto;

    const patient = await this.patientRepo.findOne({ where: { id: patientId } });
    if (!patient) throw new NotFoundException('Patient not found');

    const doctor = await this.doctorRepo.findOne({ where: { id: doctorId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    if (!slot) throw new BadRequestException('Slot is required');

    const slotDate = new Date(slot);
    slotDate.setSeconds(0, 0);

    const alreadyBooked = await this.apptRepo.findOne({
      where: { doctorId, slot: slotDate, status: 'confirmed' },
    });

    if (alreadyBooked) {
      throw new ConflictException('Slot already booked');
    }

    const endTime = new Date(slotDate);
endTime.setMinutes(endTime.getMinutes() + doctor.slotDuration); // 15 mins


    const appt = this.apptRepo.create({
      patientId,
      doctorId,
      slot: slotDate,
      startTime: slotDate,
      endTime,
      status: 'confirmed',
    });

    return await this.apptRepo.save(appt);
  }

  async getAppointmentDetails(id: number) {
    const appt = await this.apptRepo.findOne({
      where: { id },
      relations: ['patient', 'doctor'],
    });
    if (!appt) throw new NotFoundException('Appointment not found');
    return appt;
  }

  async cancelAppointment(id: number, dto: CancelAppointmentDto) {
    const appt = await this.apptRepo.findOne({ where: { id } });
    if (!appt) throw new NotFoundException('Appointment not found');

    if (appt.status === 'cancelled') {
      throw new ConflictException('Appointment is already cancelled');
    }

    appt.status = 'cancelled';
    appt.cancelledBy = dto.cancelledBy;
    appt.cancellationReason = dto.reason ?? null;

    return await this.apptRepo.save(appt);
  }

  // 🔹 Get upcoming appointments for a doctor
  async getUpcomingAppointmentsByDoctor(
    doctorId: number,
    date?: string,
    status?: string,
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: any = {
      doctorId,
      slot: MoreThanOrEqual(today),
      status: 'confirmed',
    };

    if (date) {
      const day = new Date(date);
      const startOfDay = new Date(day);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(day);
      endOfDay.setHours(23, 59, 59, 999);
      where.slot = Between(startOfDay, endOfDay);
    }

    if (status) {
      where.status = status;
    }

    return this.apptRepo.find({
      where,
      relations: ['patient'],
      order: { slot: 'ASC' },
    });
  }
}
