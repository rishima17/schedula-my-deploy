import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Availability } from '../entities/Availability';
import { Doctor } from '../entities/Doctor';
import { AvailabilityDto } from './dto/availabilty.dto';
import { format, addMinutes } from 'date-fns';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability)
    private availabilityRepo: Repository<Availability>,

    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,
  ) {}

  // Fetch all available slots for a doctor on a specific day
  async getAvailableSlots(doctorId: number, date: string) {
    const doctor = await this.doctorRepo.findOne({ where: { id: doctorId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const availabilities = await this.availabilityRepo.find({
      where: { doctor: { id: doctorId }, day: date, status: 'free' },
      order: { startTime: 'ASC' },
    });

    const slots: { time: string; available: number }[] = [];

    for (const avail of availabilities) {
      // Treat start/end as UTC (append Z)
      const startUTC = new Date(`${avail.day}T${avail.startTime}Z`);
      const endUTC = new Date(`${avail.day}T${avail.endTime}Z`);

      let current = new Date(startUTC);

      while (current < endUTC) {
        slots.push({
          time: format(current, "yyyy-MM-dd'T'HH:mm:ss'Z'"), // return in UTC
          available: avail.capacity || 1,
        });
        current = addMinutes(current, avail.waveDuration);
      }
    }

    return slots;
  }

  // Create new availability
  async create(data: Partial<Availability>) {
    if (!data.day || !data.startTime || !data.endTime) {
      throw new BadRequestException('Missing required fields');
    }

    const doctor = await this.doctorRepo.findOne({ where: { id: data.doctor?.id } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const existing = await this.availabilityRepo.findOne({
      where: { doctor: { id: doctor.id }, day: data.day },
    });

    if (existing) throw new ConflictException('Availability already exists for this day');

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

  // Expand availability (merge multiple waves into one block)
  async expandAvailability(dto: {
    doctorId: number;
    date: string;
    newEndTime: string;
    waveDuration: number;
    waveSize: number;
  }) {
    const { doctorId, date, newEndTime, waveDuration, waveSize } = dto;

    const doctor = await this.doctorRepo.findOne({ where: { id: doctorId } });
    if (!doctor) throw new NotFoundException('Doctor not found');

    const existing = await this.availabilityRepo.find({
      where: { doctor: { id: doctorId }, day: date },
      order: { startTime: 'ASC' },
    });

    if (!existing.length) throw new ConflictException('No existing availability to expand');

    const firstWave = existing[0];

    // Update doctor preferences
    doctor.consultingEnd = newEndTime;
    doctor.slotDuration = waveDuration || doctor.slotDuration;
    doctor.capacityPerSlot = waveSize || doctor.capacityPerSlot;
    await this.doctorRepo.save(doctor);

    // Delete old waves
    await this.availabilityRepo.delete(existing.map(w => w.id));

    // Create merged availability block
    const merged = this.availabilityRepo.create({
      doctor,
      day: date,
      startTime: firstWave.startTime,
      endTime: newEndTime,
      waveDuration: waveDuration || firstWave.waveDuration,
      capacity: waveSize,
      status: 'free',
    });

    return this.availabilityRepo.save(merged);
  }

  // Shrink availability into one block (not multiple DB rows anymore)
 async shrinkAvailability(dto: AvailabilityDto) {
  const { doctorId, date, startTime, endTime, waveDuration, waveSize } = dto;

  if (!doctorId || !date || !startTime || !endTime || !waveDuration || !waveSize) {
    throw new BadRequestException('Missing required fields for shrinking');
  }

  const doctor = await this.doctorRepo.findOne({ where: { id: doctorId } });
  if (!doctor) throw new NotFoundException('Doctor not found');

  // Delete old availability
  await this.availabilityRepo.delete({ doctor: { id: doctorId }, day: date });

  // Update doctor entity with new timings
  doctor.consultingStart = startTime;
  doctor.consultingEnd = endTime;
  doctor.slotDuration = waveDuration;
  doctor.capacityPerSlot = waveSize;
  await this.doctorRepo.save(doctor);

  // Create merged availability block
  const merged = this.availabilityRepo.create({
    doctor,
    day: date,
    startTime,
    endTime,
    waveDuration,
    capacity: waveSize,
    status: 'free',
  });

  return this.availabilityRepo.save(merged);
}


  // Just return raw availability records (for UI)
  async getAvailableSlotsForDoctor(doctorId: number, date: string) {
    const availabilities = await this.availabilityRepo.find({
      where: { doctor: { id: doctorId }, day: date, status: 'free' },
      order: { startTime: 'ASC' },
    });

    return availabilities.map(avail => ({
      startTime: avail.startTime,
      endTime: avail.endTime,
    }));
  }
}
