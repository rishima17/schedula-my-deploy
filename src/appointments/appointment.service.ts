import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { Appointment } from '../entities/Appointment';
import { Patient } from '../entities/Patient';
import { Doctor } from '../entities/Doctor';
import { Availability } from '../entities/Availability';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { format } from 'date-fns';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment)
    private readonly apptRepo: Repository<Appointment>,

    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,

    @InjectRepository(Doctor)
    private readonly doctorRepo: Repository<Doctor>,

    @InjectRepository(Availability)
    private readonly availabilityRepo: Repository<Availability>,
  ) {}

  async listDoctors() {
    return this.doctorRepo.find();
  }

  // Get available slots
  async getAvailableSlots(doctorId: number, date: string) {
    const doctor = await this.doctorRepo.findOne({ where: { id: doctorId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const day = new Date(date);
    if (isNaN(day.getTime())) throw new BadRequestException('Invalid date format');

    // Check availability table first
    const availabilities = await this.availabilityRepo.find({
      where: { doctor: { id: doctorId }, day: date, status: 'free' },
      order: { startTime: 'ASC' },
    });

    if (availabilities.length > 0) {
      return this.generateSlotsFromAvailability(doctor, availabilities);
    }

    // fallback → doctor's default consulting hours
    return this.generateFixedSlots(doctor, day);
  }

  // Generate slots from Availability entity
  private async generateSlotsFromAvailability(
    doctor: Doctor,
    availabilities: Availability[],
  ) {
    const slots: { time: string; available: number }[] = [];

    for (const availability of availabilities) {
      const start = new Date(`${availability.day}T${availability.startTime}`);
      const end = new Date(`${availability.day}T${availability.endTime}`);

      for (
        let t = new Date(start);
        t < end;
        t.setMinutes(t.getMinutes() + availability.waveDuration)
      ) {
        const slotStart = new Date(t);
        slotStart.setSeconds(0, 0);

        const booked = await this.apptRepo.count({
          where: { doctorId: doctor.id, slot: slotStart, status: 'confirmed' },
        });

        slots.push({
          time: format(slotStart, "yyyy-MM-dd'T'HH:mm:ss"), // IST-friendly
          available: booked < availability.capacity ? 1 : 0,
        });
      }
    }

    return slots;
  }

  // Fallback slots when no Availability exists
  private async generateFixedSlots(doctor: Doctor, day: Date) {
    const slots: { time: string; available: number }[] = [];
    const [startHour, startMin] = doctor.consultingStart.split(':').map(Number);
    const [endHour, endMin] = doctor.consultingEnd.split(':').map(Number);

    const start = new Date(day);
    start.setHours(startHour, startMin, 0, 0);
    const end = new Date(day);
    end.setHours(endHour, endMin, 0, 0);

    for (
      let t = new Date(start);
      t < end;
      t.setMinutes(t.getMinutes() + doctor.slotDuration)
    ) {
      const slotStart = new Date(t);
      slotStart.setSeconds(0, 0);

      const booked = await this.apptRepo.count({
        where: { doctorId: doctor.id, slot: slotStart, status: 'confirmed' },
      });

      slots.push({
        time: format(slotStart, "yyyy-MM-dd'T'HH:mm:ss"), // IST format
        available: booked === 0 ? 1 : 0, // free if not booked
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
    endTime.setMinutes(endTime.getMinutes() + doctor.slotDuration);

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
