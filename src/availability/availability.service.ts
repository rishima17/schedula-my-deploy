import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Availability, AvailabilityStatus } from '../entities/Availability';
import { Doctor } from '../entities/Doctor';
import { AvailabilityDto } from './dto/availabilty.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability)
    private availabilityRepo: Repository<Availability>,

    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,
  ) {}

  // Create a new availability
  async create(data: Partial<Availability>) {
    const doctor = await this.doctorRepo.findOne({ where: { id: data.doctor?.id } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const availability = this.availabilityRepo.create({
      ...data,
      doctor,
      status: data.status ?? 'free',
    });
    return this.availabilityRepo.save(availability);
  }

  // List availability for a doctor
  findByDoctor(doctorId: number) {
    return this.availabilityRepo.find({
      where: { doctor: { id: doctorId } },
      relations: ['doctor'],
    });
  }

  // Get available slots for booking
  async getAvailableSlots(doctorId: number, date: string) {
    const slots = await this.availabilityRepo.find({
      where: { doctor: { id: doctorId }, day: date, status: 'free' as AvailabilityStatus },
      order: { startTime: 'ASC' },
      relations: ['doctor'],
    });

    return slots.map(slot => ({
      time: `${slot.day}T${slot.startTime}`,
      available: slot.capacity,
    }));
  }

  // Expand availability (single block)
  async expandAvailability(dto: AvailabilityDto) {
    const { doctorId, date, newEndTime, waveDuration, waveSize } = dto;

    const doctor = await this.doctorRepo.findOne({ where: { id: doctorId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const availability = this.availabilityRepo.create({
      day: date,
      startTime: doctor.consultingStart,
      endTime: newEndTime,
      waveDuration,
      capacity: waveSize,
      status: 'free',
      doctor,
    });

    return this.availabilityRepo.save(availability);
  }
}
