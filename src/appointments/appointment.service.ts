import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Appointment } from '../entities/Appointment';
import { Patient } from '../entities/Patient';
import { Doctor } from '../entities/Doctor';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Injectable()
export class AppointmentService {
  constructor(
    @InjectRepository(Appointment) private readonly apptRepo: Repository<Appointment>,
    @InjectRepository(Patient) private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Doctor) private readonly doctorRepo: Repository<Doctor>,
  ) {}

  async listDoctors() {
    return this.doctorRepo.find();
  }

  // ---------------------- Get Slots ----------------------
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
      slotStart.setSeconds(0, 0); // ✅ normalize

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

  // ---------------------- Confirm Appointment ----------------------
  async confirmAppointment(dto: CreateAppointmentDto) {
    const { patientId, doctorId, slot } = dto;

    const patient = await this.patientRepo.findOne({ where: { id: patientId } });
    if (!patient) throw new NotFoundException('Patient not found');
    

    const doctor = await this.doctorRepo.findOne({ where: { id: doctorId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    if (doctor.scheduleType === 'wave') {
      if (!slot) throw new BadRequestException('Slot is required for wave scheduling');

      const slotDate = new Date(slot);
      slotDate.setSeconds(0, 0); // ✅ normalize

      const booked = await this.apptRepo.count({
        where: { doctorId, slot: slotDate, status: 'confirmed' },
      });

      if (booked >= doctor.capacityPerSlot) {
        throw new ConflictException('Slot capacity full');
      }

      const appt = this.apptRepo.create({
        patientId,
        doctorId,
        slot: slotDate,
        status: 'confirmed',
      });
      return await this.apptRepo.save(appt);
    } else {
      // Stream scheduling → auto assign
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

      // auto-assign based on booked count
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
  }

  // ---------------------- Get Appointment ----------------------
  async getAppointmentDetails(id: number) {
    const appt = await this.apptRepo.findOne({
      where: { id },
      relations: ['patient', 'doctor'],
    });
    if (!appt) throw new NotFoundException('Appointment not found');
    return appt;
  }
}
