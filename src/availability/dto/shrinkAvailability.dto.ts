// src/availability/dto/shrink-availability.dto.ts
import { IsInt, IsString } from 'class-validator';

export class ShrinkAvailabilityDto {
  @IsInt()
  doctorId: number;

  @IsString()
  date: string; // e.g., "2025-09-25"

  @IsString()
  startTime: string; // e.g., "09:00:00"

  @IsString()
  endTime: string; // e.g., "13:00:00"

  @IsInt()
  waveDuration: number; // in minutes

  @IsInt()
  waveSize: number; // slots per wave
}
