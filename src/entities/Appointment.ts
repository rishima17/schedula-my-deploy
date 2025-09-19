import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Patient } from './Patient';
import { Doctor } from './Doctor';

@Entity('appointment')
export class Appointment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Patient, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column()
  patientId: number;

  @ManyToOne(() => Doctor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctorId' })
  doctor: Doctor;

  @Column()
  doctorId: number;

  @Column({ type: 'timestamptz' })
  slot: Date; // timezone-aware datetime

  @Column({ default: 'confirmed' })
  status: string; // confirmed, cancelled, completed

  @CreateDateColumn()
  createdAt: Date;
}
