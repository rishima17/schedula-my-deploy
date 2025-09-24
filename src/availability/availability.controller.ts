
import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { AvailabilityService } from './availability.service';

@Controller('api/v1/availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  // List all availability for a doctor
  @Get('doctor/:doctorId')
  listDoctorAvailability(@Param('doctorId') doctorId: number) {
    return this.availabilityService.findByDoctor(+doctorId);
  }

  // Create a new availability slot/wave
  @Post('create')
  createAvailability(@Body() data: any) {
    return this.availabilityService.create(data);
  }

  // Expand existing availability (wave-based)
  @Post('expand')
  async expandAvailability(@Body() dto: {
    doctorId: number;
    date: string;
    newEndTime: string;
    waveDuration: number;
    waveSize: number;
  }) {
    return this.availabilityService.expandAvailability(dto);
  }

  // Get available slots for booking
  @Get('slots')
  getAvailableSlots(@Query('doctorId') doctorId: number, @Query('date') date: string) {
    return this.availabilityService.getAvailableSlots(+doctorId, date);
  }
}