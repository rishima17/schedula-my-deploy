import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnboardingProgress } from '../entities/onboarding-progress.entity';
import { CreateOnboardingDto } from './dto/create-onboarding.dto';
import { Patient } from '../entities/Patient';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(OnboardingProgress)
    private readonly onboardingRepo: Repository<OnboardingProgress>,

    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
  ) {}

  async saveStep(dto: CreateOnboardingDto) {
    // Ensure patient exists
    const patient = await this.patientRepo.findOne({ where: { id: dto.patientId } });
    if (!patient) throw new NotFoundException('Patient not found');

    const progress = this.onboardingRepo.create({
      stepId: dto.stepId,
      data: dto.data,
      patient,
    });

    return this.onboardingRepo.save(progress);
  }

  async getProgress(patientId: number) {
    const patient = await this.patientRepo.findOne({ where: { id: patientId } });
    if (!patient) throw new NotFoundException('Patient not found');

    return this.onboardingRepo.find({
      where: { patient },
      order: { stepId: 'ASC' },
    });
  }
}
