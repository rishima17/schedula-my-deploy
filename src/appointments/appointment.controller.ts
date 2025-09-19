import { Controller, Post, Body, Get, Param, Query, Patch } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { CancelAppointmentDto } from "./dto/cancel-appointment.dto";

@Controller('api/v1/appointments')
export class AppointmentController {
  constructor(private readonly apptService: AppointmentService) {}

  @Get('doctors')
  listDoctors() {
    return this.apptService.listDoctors();
  }

  @Get('slots')
  getAvailableSlots(
    @Query('doctorId') doctorId: number,
    @Query('date') date: string,
  ) {
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

  @Patch('cancel/:id')
  cancelAppointment(@Param('id') id: number, @Body() dto: CancelAppointmentDto) {
    return this.apptService.cancelAppointment(+id, dto);
  }

  // 🔹 UPDATED ENDPOINT: upcoming appointments with optional query parameters
  @Get('doctor/:doctorId/upcoming')
  getDoctorUpcomingAppointments(
    @Param('doctorId') doctorId: number,
    @Query('date') date?: string,
    @Query('status') status?: string,
  ) {
    return this.apptService.getUpcomingAppointmentsByDoctor(+doctorId, date, status);
  }
}
