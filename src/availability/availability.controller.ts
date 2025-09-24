import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { AvailabilityDto } from './dto/availabilty.dto';

@Controller('api/v1/availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get('doctor/:doctorId')
  listDoctorAvailability(@Param('doctorId') doctorId: number) {
    return this.availabilityService.findByDoctor(+doctorId);
  }

  @Post('create')
  createAvailability(@Body() data: any) {
    return this.availabilityService.create(data);
  }

  @Post('expand')
expandAvailability(@Body() dto: AvailabilityDto) {
  return this.availabilityService.expandAvailability(dto);
}


  @Get('slots')
  getAvailableSlots(@Query('doctorId') doctorId: number, @Query('date') date: string) {
    return this.availabilityService.getAvailableSlots(+doctorId, date);
  }
}
