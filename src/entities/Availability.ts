import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Doctor } from './Doctor';

@Entity()
export class Availability {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  day: string; // e.g., 'Monday' or '2025-09-24'

  @Column()
  startTime: string; // e.g., '09:00'

  @Column()
  endTime: string; // e.g., '09:30'

  @Column({ nullable: true })
  waveDuration: number; // duration of the wave in minutes, e.g., 30

  @Column({ nullable: true })
  capacity: number; // patients per wave, e.g., 3

  @Column({ default: 'free' })
  status: string; // 'free' or 'booked'

  @ManyToOne(() => Doctor, (doctor) => doctor.availabilities, { onDelete: 'CASCADE' })
  doctor: Doctor;
}