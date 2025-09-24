import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Doctor } from './Doctor';

// Use string literal union for status
export type AvailabilityStatus = 'free' | 'booked';

@Entity()
export class Availability {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date', nullable: true })
day: string;

@Column({ type: 'time', nullable: true })
startTime: string;


  @Column({ type: 'time',nullable:true })
  endTime: string; // 'HH:MM'

  @Column({ default: 30 })
  waveDuration: number; // in minutes

  @Column({ default: 1 })
  capacity: number; // patients per wave

  @Column({
    type: 'enum',
    enum: ['free', 'booked'],
    default: 'free',
  })
  status: AvailabilityStatus;

  @ManyToOne(() => Doctor, (doctor) => doctor.availabilities, { onDelete: 'CASCADE' })
  doctor: Doctor;
}
