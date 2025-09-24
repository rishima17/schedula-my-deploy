import { IsInt, IsOptional, IsString } from 'class-validator';

export class AvailabilityDto {
  @IsOptional()
  @IsInt()
  doctorId?: number;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsString()
  newEndTime?: string;

  @IsOptional()
  @IsInt()
  waveDuration?: number;

  @IsOptional()
  @IsInt()
  waveSize?: number;

  @IsOptional()
  @IsString()
  startTime?: string;

  @IsOptional()
  @IsString()
  endTime?: string;

  @IsOptional()
  @IsInt()
  capacity?: number;
}
