import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Availability } from '../entities/Availability';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability)
    private availabilityRepo: Repository<Availability>,
  ) {}

  // Create a new availability slot/wave
  create(data: Partial<Availability>) {
    const availability = this.availabilityRepo.create(data);
    return this.availabilityRepo.save(availability);
  }

  // Get all availability for a doctor
  findByDoctor(doctorId: number) {
    return this.availabilityRepo.find({
      where: { doctor: { id: doctorId } },
      relations: ['doctor'],
    });
  }

  // Get all free slots/waves for a doctor on a specific day (in IST)
  async getAvailableSlots(doctorId: number, day: string) {
    const slots = await this.availabilityRepo.find({
      where: { doctor: { id: doctorId }, day, status: 'free' },
      order: { startTime: 'ASC' },
      relations: ['doctor'],
    });

    return slots.map(slot => {
      // Parse startTime and convert to IST
      const [hour, minute] = slot.startTime.split(':').map(Number);
      const dateObj = new Date(`${day}T00:00:00`); // base date
      dateObj.setHours(hour);
      dateObj.setMinutes(minute);

      // Add 5 hours 30 minutes for IST
      dateObj.setHours(dateObj.getHours() + 5);
      dateObj.setMinutes(dateObj.getMinutes() + 30);

      return {
        time: dateObj.toISOString().slice(0, 16), // e.g., "2025-09-25T09:00"
        available: slot.capacity || 1,
      };
    });
  }

  // Expand availability by generating new waves
  async expandAvailability(dto: {
    doctorId: number;
    date: string;
    newEndTime: string;
    waveDuration: number;
    waveSize: number;
  }) {
    const { doctorId, date, newEndTime, waveDuration, waveSize } = dto;

    // Fetch last existing wave
    const lastWave = await this.availabilityRepo.find({
      where: { doctor: { id: doctorId }, day: date },
      order: { endTime: 'DESC' },
      take: 1,
    });

    if (!lastWave.length) throw new Error('No existing waves found');

    let currentTime = lastWave[0].endTime;

    // Helper to add minutes to HH:MM string
    const addMinutes = (timeStr: string, mins: number) => {
      const [h, m] = timeStr.split(':').map(Number);
      const dt = new Date();
      dt.setHours(h);
      dt.setMinutes(m + mins);
      const hh = dt.getHours().toString().padStart(2, '0');
      const mm = dt.getMinutes().toString().padStart(2, '0');
      return `${hh}:${mm}`;
    };

    const newWaves: Availability[] = [];

    while (currentTime < newEndTime) {
      const waveEnd = addMinutes(currentTime, waveDuration);

      // Check for overlapping wave
      const exists = await this.availabilityRepo.findOne({
        where: { doctor: { id: doctorId }, day: date, startTime: currentTime },
      });

      if (!exists) {
        newWaves.push(
          this.availabilityRepo.create({
            doctor: { id: doctorId },
            day: date,
            startTime: currentTime,
            endTime: waveEnd,
            waveDuration,
            capacity: waveSize,
            status: 'free',
          }),
        );
      }

      currentTime = waveEnd;
    }

    return this.availabilityRepo.save(newWaves);
  }
}
