import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Controller('api/v1/appointments')
export class AppointmentController {
  constructor(private readonly apptService: AppointmentService) {}

  @Get('doctors')
  listDoctors() {
    return this.apptService.listDoctors();
  }

  @Get('slots')
  getAvailableSlots(@Query('doctorId') doctorId: number, @Query('date') date: string) {
    return this.apptService.getAvailableSlots(+doctorId, date);
  }

  @Post('confirm')
  confirmAppointment(@Body() dto: CreateAppointmentDto) {
    return this.apptService.confirmAppointment(dto);
  }

  @Get(':id')
  getAppointmentDetails(@Param('id') id: number) {
    return this.apptService.getAppointmentDetails(+id);
  }
}
