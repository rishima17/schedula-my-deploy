import { 
  Injectable, 
  NotFoundException, 
  ConflictException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Availability } from '../entities/Availability';
import { Doctor } from '../entities/Doctor';
import { addMinutes, format } from 'date-fns';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability)
    private availabilityRepo: Repository<Availability>,

    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,
  ) {}

  // ✅ Create a new availability slot/wave
  async create(data: Partial<Availability>) {
    const doctor = await this.doctorRepo.findOne({ where: { id: data.doctor?.id } });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // Validation: doctor can create availability only once per day
    const existingAvailability = await this.availabilityRepo.findOne({
      where: { doctor: { id: doctor.id }, day: data.day },
    });

    if (existingAvailability) {
      throw new ConflictException(
        'Doctor already created availability for this day. Please expand instead.',
      );
    }

    // 🔹 Update doctor consulting timings with availability timings
    doctor.consultingStart = data.startTime || doctor.consultingStart;
    doctor.consultingEnd = data.endTime || doctor.consultingEnd;
    doctor.slotDuration = data.waveDuration || doctor.slotDuration;
    doctor.capacityPerSlot = data.capacity || doctor.capacityPerSlot;
    await this.doctorRepo.save(doctor);

    // 🔹 Save availability slot
    const availability = this.availabilityRepo.create({ ...data, doctor });
    return this.availabilityRepo.save(availability);
  }

  // ✅ Get all availability for a doctor
  findByDoctor(doctorId: number) {
    return this.availabilityRepo.find({
      where: { doctor: { id: doctorId } },
      relations: ['doctor'],
    });
  }

  // ✅ Get all free slots/waves for a doctor on a specific day
  async getAvailableSlots(doctorId: number, date: string) {
    const doctor = await this.doctorRepo.findOne({
      where: { id: doctorId },
      relations: ['user'],
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    // ✅ Prefer availability table
    const availability = await this.availabilityRepo.find({
      where: { doctor: { id: doctorId }, day: date, status: 'free' },
      order: { startTime: 'ASC' },
    });

    let slots: string[] = [];

    if (availability.length) {
      slots = availability.map(slot => slot.startTime);
    } else {
      // ✅ fallback: use doctor’s updated consulting timings
      const startTime = doctor.consultingStart || '09:00:00';
      const endTime = doctor.consultingEnd || '12:00:00';
      const slotDuration = doctor.slotDuration || 15;

      if (doctor.scheduleType === 'wave') {
        let current = new Date(`${date}T${startTime}`);
        const end = new Date(`${date}T${endTime}`);

        while (current < end) {
          slots.push(format(current, 'HH:mm'));
          current = addMinutes(current, slotDuration);
        }
      } else if (doctor.scheduleType === 'stream') {
        slots.push(`${startTime} - ${endTime}`);
      }
    }

    return {
      doctorId,
      doctorName: doctor.user?.name || 'Unknown',
      date,
      slots,
    };
  }

  // ✅ Expand availability by merging existing waves
  async expandAvailability(dto: {
    doctorId: number;
    date: string;
    newEndTime: string;
    waveDuration: number;
    waveSize: number;
  }) {
    const { doctorId, date, newEndTime, waveDuration, waveSize } = dto;

    const doctor = await this.doctorRepo.findOne({ where: { id: doctorId } });
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const existingWaves = await this.availabilityRepo.find({
      where: { doctor: { id: doctorId }, day: date },
      order: { startTime: 'ASC' },
    });

    if (!existingWaves.length) {
      throw new ConflictException('No existing waves found. Please create availability first.');
    }

    const firstWave = existingWaves[0];

    // 🔹 Merge and also update doctor timings
    doctor.consultingEnd = newEndTime;
    doctor.slotDuration = waveDuration || doctor.slotDuration;
    doctor.capacityPerSlot = waveSize || doctor.capacityPerSlot;
    await this.doctorRepo.save(doctor);

    const mergedAvailability = this.availabilityRepo.create({
      doctor,
      day: date,
      startTime: firstWave.startTime,
      endTime: newEndTime,
      waveDuration: waveDuration || firstWave.waveDuration,
      capacity: waveSize,
      status: 'free',
    });

    await this.availabilityRepo.delete(existingWaves.map(w => w.id));
    return this.availabilityRepo.save(mergedAvailability);
  }
}
