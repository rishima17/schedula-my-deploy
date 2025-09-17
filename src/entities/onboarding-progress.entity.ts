import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Patient } from './Patient';

@Entity('onboarding_progress')
export class OnboardingProgress {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  stepId: number; // e.g., 1 = profile, 2 = medical history, 3 = preferences

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any>; // flexible JSON field to store step-specific data

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column()
  patientId: number;
}
