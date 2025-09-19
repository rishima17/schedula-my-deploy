


import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CancelAppointmentDto {
  @IsNotEmpty()
  @IsIn(['doctor', 'patient'])
  cancelledBy: 'doctor' | 'patient';

  @IsOptional()
  @IsString()
  reason?: string;
}