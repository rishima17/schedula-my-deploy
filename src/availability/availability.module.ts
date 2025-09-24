import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Availability } from '../entities/Availability';
import { Doctor } from '../entities/Doctor';
import { AvailabilityService } from './availability.service';
import { AvailabilityController } from './availability.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Availability, Doctor]), // <-- include Doctor here
  ],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
})
export class AvailabilityModule {}