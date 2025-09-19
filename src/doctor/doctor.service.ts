import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from '../entities/Doctor';
import { addMinutes, format } from 'date-fns';

@Injectable()
export class DoctorService {
  constructor(
    @InjectRepository(Doctor)
    private readonly doctorRepository: Repository<Doctor>,
  ) {}

  // ✅ Get all doctors with their user details
  async getAllDoctors() {
    return this.doctorRepository.find({ relations: ['user'] });
  }

  // ✅ Filter doctors by ID or specialization (optional)
  async filterDoctors(id?: number, specialization?: string) {
    const query = this.doctorRepository
      .createQueryBuilder('doctor')
      .leftJoinAndSelect('doctor.user', 'user');

    if (id) {
      query.andWhere('doctor.id = :id', { id: Number(id) });
    }

    if (specialization) {
      // Case-insensitive search for specialization
      query.andWhere('LOWER(doctor.specialization) = LOWER(:specialization)', {
        specialization,
      });
    }

    const doctors = await query.getMany();

    if (!doctors || doctors.length === 0) {
      throw new NotFoundException('No doctors found with the given criteria');
    }

    return doctors;
  }

  // ✅ Get available slots for a doctor on a specific date
  async getAvailableSlots(doctorId: number, date: string) {
    const doctor = await this.doctorRepository.findOne({
      where: { id: doctorId },
      relations: ['user'],
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const slots: string[] = [];
    const startTime = doctor.consultingStart || '09:00:00';
    const endTime = doctor.consultingEnd || '16:00:00';
    const slotDuration = doctor.slotDuration || 30;

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

    return {
      doctorId,
      doctorName: doctor.user?.name || 'Unknown',
      date,
      slots,
    };
  }

  // ✅ Get doctor by ID
  async getDoctorById(id: number) {
    const doctor = await this.doctorRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return doctor;
  }
}
