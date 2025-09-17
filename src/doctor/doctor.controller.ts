import { Controller, Get, Query, Param } from '@nestjs/common';
import { DoctorService } from './doctor.service';

@Controller('api/v1/doctors')
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  // ✅ Get all doctors or filter by id or specialization
  @Get()
  async getDoctors(
    @Query('id') id?: number,
    @Query('specialization') specialization?: string,
  ) {
    if (id || specialization) {
      return this.doctorService.filterDoctors(id, specialization);
    }
    return this.doctorService.getAllDoctors();
  }

  // ✅ Get doctor by ID
  @Get(':id')
  async getDoctorById(@Param('id') id: number) {
    return this.doctorService.getDoctorById(Number(id));
  }

  // ✅ Get available slots for a doctor on a specific date
  @Get(':id/slots')
  async getAvailableSlots(
    @Param('id') id: number,
    @Query('date') date: string,
  ) {
    if (!date) {
      throw new Error('Query parameter "date" is required');
    }
    return this.doctorService.getAvailableSlots(Number(id), date);
  }
}
