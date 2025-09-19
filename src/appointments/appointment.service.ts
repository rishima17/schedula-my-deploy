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

    if (doctor.scheduleType === 'wave') {
      return this.generateWaveSlots(doctor, day);
    } else {
      return this.getStreamSlots(doctor, day);
    }
  }

  private async generateWaveSlots(doctor: Doctor, day: Date) {
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
        available: Math.max(0, doctor.capacityPerSlot - booked),
      });
    }

    return slots;
  }

  private async getStreamSlots(doctor: Doctor, day: Date) {
    const startOfDay = new Date(day);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(day);
    endOfDay.setHours(23, 59, 59, 999);

    const booked = await this.apptRepo.count({
      where: {
        doctorId: doctor.id,
        slot: Between(startOfDay, endOfDay),
        status: 'confirmed',
      },
    });

    return {
      date: day.toISOString().split('T')[0],
      remainingCapacity: Math.max(0, doctor.dailyCapacity - booked),
    };
  }

  async confirmAppointment(dto: CreateAppointmentDto) {
    const { patientId, doctorId, slot } = dto;

    const patient = await this.patientRepo.findOne({ where: { id: patientId } });
    if (!patient) throw new NotFoundException('Patient not found');
    if (!patient.isVerified) throw new ConflictException('Patient must be verified');

    const doctor = await this.doctorRepo.findOne({ where: { id: doctorId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    // 🔹 Wave scheduling: divide slot time equally among patients
    if (doctor.scheduleType === 'wave') {
      if (!slot) throw new BadRequestException('Slot is required for wave scheduling');

      const slotDate = new Date(slot);
      slotDate.setSeconds(0, 0);

      const existingPatients = await this.apptRepo.find({
        where: { doctorId, slot: slotDate, status: 'confirmed' },
        order: { createdAt: 'ASC' },
      });

      if (existingPatients.length >= doctor.capacityPerSlot) {
        throw new ConflictException('Slot capacity full');
      }

      // ✅ Calculate sub-slot duration for each patient
      const subDuration = doctor.slotDuration / doctor.capacityPerSlot; // minutes
      const patientIndex = existingPatients.length; // next patient position

      const startTime = new Date(slotDate);
      startTime.setMinutes(startTime.getMinutes() + patientIndex * subDuration);

      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + subDuration);

      const appt = this.apptRepo.create({
        patientId,
        doctorId,
        slot: slotDate, // overall wave slot
        startTime,      // individual patient start time
        endTime,        // individual patient end time
        status: 'confirmed',
      });

      return await this.apptRepo.save(appt);
    }

    // 🔹 Stream scheduling: auto-assign next sequential slot
    const today = new Date(slot || new Date());

    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const booked = await this.apptRepo.count({
      where: {
        doctorId,
        slot: Between(startOfDay, endOfDay),
        status: 'confirmed',
      },
    });

    if (booked >= doctor.dailyCapacity) {
      throw new ConflictException('No capacity left for today');
    }

    const assignedSlot = new Date(today);
    assignedSlot.setHours(parseInt(doctor.consultingStart.split(':')[0], 10), 0, 0, 0);
    assignedSlot.setMinutes(assignedSlot.getMinutes() + booked * doctor.slotDuration);
    assignedSlot.setSeconds(0, 0);

    const appt = this.apptRepo.create({
      patientId,
      doctorId,
      slot: assignedSlot,
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
