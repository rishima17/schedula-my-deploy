import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsIn, IsNumber, IsString } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsNotEmpty()
  @IsIn(['doctor', 'patient'])
  role: 'doctor' | 'patient';

  // Patient fields
  @IsOptional()
  @IsNumber()
  age?: number;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  medicalHistory?: string;

  // Doctor fields
  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsNumber()
  experience?: number;

  @IsOptional()
  @IsIn(['wave', 'stream'])
  scheduleType?: 'wave' | 'stream';

  @IsOptional()
  @IsString()
  consultingStart?: string;

  @IsOptional()
  @IsString()
  consultingEnd?: string;

  @IsOptional()
  @IsNumber()
  slotDuration?: number;

  @IsOptional()
  @IsNumber()
  capacityPerSlot?: number;

  @IsOptional()
  @IsNumber()
  dailyCapacity?: number;
}
