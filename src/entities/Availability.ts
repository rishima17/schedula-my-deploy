import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Doctor } from './Doctor';

@Entity()
export class Availability {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  day: string; // e.g., 'Monday'

  @Column()
  startTime: string; // e.g., '09:00'

  @Column()
  endTime: string; // e.g., '17:00'

  @ManyToOne(() => Doctor, (doctor) => doctor.availabilities, { onDelete: 'CASCADE' })
  doctor: Doctor;
}
