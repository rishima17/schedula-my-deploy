import { IsNumber, IsOptional, IsObject } from 'class-validator';

export class CreateOnboardingDto {
  @IsNumber()
  patientId: number;

  @IsNumber()
  stepId: number;

  @IsObject()
  @IsOptional()
  data?: any;
}
