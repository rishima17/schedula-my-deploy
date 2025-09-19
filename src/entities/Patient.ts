import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('patient')
export class Patient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', nullable: true })  // nullable allows no age provided
  age: number | null;

  @Column({ type: 'varchar', nullable: true })
  gender: string | null;

  @Column({ type: 'varchar', nullable: true })
  medicalHistory: string | null;

  @Column({ default: 1 }) // onboarding step
  onboardingStep: number;

  @Column({ default: false })
  isVerified: boolean;

  @OneToOne(() => User, (user) => user.patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;  // FK to User
}
