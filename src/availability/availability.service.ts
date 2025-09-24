import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Availability } from '../entities/Availability';
import { Doctor } from '../entities/Doctor';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability)
    private availabilityRepo: Repository<Availability>,

    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,
  ) {}

  // Create a new availability slot/wave
  async create(data: Partial<Availability>) {
    const doctor = await this.doctorRepo.findOne({ where: { id: data.doctor?.id } });
    if (!doctor) throw new Error('Doctor not found');

    const availability = this.availabilityRepo.create({ ...data, doctor });
    return this.availabilityRepo.save(availability);
  }

  // Get all availability for a doctor
  findByDoctor(doctorId: number) {
    return this.availabilityRepo.find({
      where: { doctor: { id: doctorId } },
      relations: ['doctor'],
    });
  }

  // Get all free slots/waves for a doctor on a specific day
  async getAvailableSlots(doctorId: number, day: string) {
    const slots = await this.availabilityRepo.find({
      where: { doctor: { id: doctorId }, day, status: 'free' },
      order: { startTime: 'ASC' },
      relations: ['doctor'],
    });

    return slots.map(slot => {
      const [hour, minute] = slot.startTime.split(':').map(Number);
      const dateObj = new Date(`${day}T00:00:00`);
      dateObj.setHours(hour);
      dateObj.setMinutes(minute);

      // Convert to IST if needed
      dateObj.setHours(dateObj.getHours() + 5);
      dateObj.setMinutes(dateObj.getMinutes() + 30);

      return {
        time: dateObj.toISOString().slice(0, 16),
        available: slot.capacity || 1,
      };
    });
  }

  // Expand availability by merging existing waves
  async expandAvailability(dto: {
    doctorId: number;
    date: string;
    newEndTime: string;
    waveDuration: number;
    waveSize: number;
  }) {
    const { doctorId, date, newEndTime, waveDuration, waveSize } = dto;

    const doctor = await this.doctorRepo.findOne({ where: { id: doctorId } });
    if (!doctor) throw new Error('Doctor not found');

    // Fetch all existing waves for that day
    const existingWaves = await this.availabilityRepo.find({
      where: { doctor: { id: doctorId }, day: date },
      order: { startTime: 'ASC' },
    });

    if (!existingWaves.length) throw new Error('No existing waves found');

    // Find first wave
    const firstWave = existingWaves[0];

    // Merge all waves into one continuous slot
    const mergedAvailability = this.availabilityRepo.create({
      doctor,
      day: date,
      startTime: firstWave.startTime,
      endTime: newEndTime,
      waveDuration: waveDuration || firstWave.waveDuration,
      capacity: waveSize,
      status: 'free',
    });

    // Delete old waves
    const oldWaveIds = existingWaves.map(w => w.id);
    await this.availabilityRepo.delete(oldWaveIds);

    // Save merged slot
    return this.availabilityRepo.save(mergedAvailability);
  }
}
