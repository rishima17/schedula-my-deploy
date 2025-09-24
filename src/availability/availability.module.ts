import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Availability } from '../entities/Availability';
import { Doctor } from '../entities/Doctor';   // 👈 import Doctor entity
import { AvailabilityService } from './availability.service';
import { AvailabilityController } from './availability.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Availability, Doctor]), // 👈 register both entities
  ],
  providers: [AvailabilityService],
  controllers: [AvailabilityController],
  exports: [TypeOrmModule],
})
export class AvailabilityModule {}
