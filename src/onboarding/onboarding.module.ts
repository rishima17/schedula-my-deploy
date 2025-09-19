import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { OnboardingProgress } from '../entities/onboarding-progress.entity';
import { Patient } from '../entities/Patient';
import { User } from '../entities/User';

@Module({
  imports: [
    TypeOrmModule.forFeature([OnboardingProgress, Patient, User]), // include all entities your service uses
  ],
  providers: [OnboardingService],
  controllers: [OnboardingController],
  exports: [OnboardingService],
})
export class OnboardingModule {}
