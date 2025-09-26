import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThan, Between } from 'typeorm';
import { Appointment } from '../entities/Appointment';
import { Patient } from '../entities/Patient';
import { Doctor } from '../entities/Doctor';
import { Availability } from '../entities/Availability';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { format, addMinutes } from 'date-fns';

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

  // ✅ Get available slots for a doctor on a specific day
  async getAvailableSlots(doctorId: number, date: string) {
    const doctor = await this.doctorRepo.findOne({ where: { id: doctorId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const availabilities = await this.availabilityRepo.find({
      where: { doctor: { id: doctorId }, day: date, status: 'free' },
      order: { startTime: 'ASC' },
    });

    const slots: { time: string; available: number }[] = [];

    for (const avail of availabilities) {
      const start = new Date(`${avail.day}T${avail.startTime}`);
      const end = new Date(`${avail.day}T${avail.endTime}`);
      let current = new Date(start);

      while (current < end) {
        const slotStart = new Date(current);
        slotStart.setSeconds(0, 0);

        // Count already booked appointments for this slot
        const bookedCount = await this.apptRepo.count({
          where: { doctorId, slot: slotStart, status: 'confirmed' },
        });

        slots.push({
          time: format(slotStart, "yyyy-MM-dd'T'HH:mm:ss"),
          available: bookedCount < avail.capacity ? 1 : 0,
        });

        current = addMinutes(current, avail.waveDuration);
      }
    }

    return slots;
  }

  // ✅ Confirm an appointment
  async confirmAppointment(dto: CreateAppointmentDto) {
  const { patientId, doctorId, slot } = dto;

  // 1️⃣ Fetch patient and doctor
  const patient = await this.patientRepo.findOne({ where: { id: patientId } });
  if (!patient) throw new NotFoundException('Patient not found');

  const doctor = await this.doctorRepo.findOne({ where: { id: doctorId } });
  if (!doctor) throw new NotFoundException('Doctor not found');

  if (!slot) throw new BadRequestException('Slot is required');

  const slotDate = new Date(slot);
  slotDate.setSeconds(0, 0); // normalize seconds

  // 2️⃣ Fetch all availability blocks for the day
  const availabilities = await this.availabilityRepo.find({
    where: {
      doctor: { id: doctorId },
      day: format(slotDate, 'yyyy-MM-dd'),
      status: 'free',
    },
  });

  // 3️⃣ Find availability block that matches the slot
  const availability = availabilities.find(avail => {
    const availStart = new Date(`${avail.day}T${avail.startTime}`);
    const availEnd = new Date(`${avail.day}T${avail.endTime}`);

    // Check if slot is within availability
    if (slotDate < availStart || slotDate >= availEnd) return false;

    // Check wave alignment
    const diffMins = (slotDate.getTime() - availStart.getTime()) / (60 * 1000);
    return diffMins % avail.waveDuration === 0;
  });

  if (!availability) {
    throw new BadRequestException('Doctor is not available at this time');
  }

  // 4️⃣ Check if slot is already fully booked
  const bookedCount = await this.apptRepo.count({
    where: { doctorId, slot: slotDate, status: 'confirmed' },
  });

  if (bookedCount >= availability.capacity) {
    throw new ConflictException('Slot already booked');
  }

  // 5️⃣ Calculate appointment end time
  const endTime = addMinutes(slotDate, availability.waveDuration);

  // 6️⃣ Create and save appointment
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
      slot: Between(today, new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000)),
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
