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

  create(data: Partial<Availability>) {
    const availability = this.availabilityRepo.create(data);
    return this.availabilityRepo.save(availability);
  }

  findByDoctor(doctorId: number) {
    return this.availabilityRepo.find({
      where: { doctor: { id: doctorId } },
      relations: ['doctor'],
    });
  }
}
