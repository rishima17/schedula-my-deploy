
import { IsNumber, IsISO8601, IsOptional } from 'class-validator';

export class CreateAppointmentDto {
  @IsNumber()
  patientId: number;

  @IsNumber()
  doctorId: number;

  // For wave: ISO8601 datetime required.
  // For stream: optional (system will auto-assign). Allow passing a date-only ISO (YYYY-MM-DD) or full datetime.
  @IsOptional()
  @IsISO8601()
  slot?: string;
}
