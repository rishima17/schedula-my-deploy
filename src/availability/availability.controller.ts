import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { AvailabilityService } from './availability.service';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post()
  create(@Body() body: any) {
    return this.availabilityService.create(body);
  }

  @Get('doctor/:id')
  findByDoctor(@Param('id') id: number) {
    return this.availabilityService.findByDoctor(id);
  }
}
