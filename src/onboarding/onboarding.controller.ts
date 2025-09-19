// onboarding.controller.ts
import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('step')
  saveStep(@Body() dto: CreateOnboardingDto) {
    return this.onboardingService.saveStep(dto);
  }

  @Get(':patientId')
  getProgress(@Param('patientId') patientId: number) {
    return this.onboardingService.getProgress(patientId);
  }
}
