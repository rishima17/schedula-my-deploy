import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Availability } from './Availability';
import { OneToMany } from 'typeorm';
@Entity('doctor')
export class Doctor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  specialization: string;

  @Column()
  experience: number;

  @Column({ type: 'varchar', default: 'wave' })
  scheduleType: 'wave' | 'stream'; // wave = predefined slots, stream = continuous flow

  // Consulting hours
  @Column({ type: 'time', nullable: true })
  consultingStart: string; // e.g. "09:00"

  @Column({ type: 'time', nullable: true })
  consultingEnd: string; // e.g. "16:00"

  // Wave-specific
  @Column({ type: 'int', default: 30 })
  slotDuration: number; // in minutes (30, 60, etc.)

  @Column({ type: 'int', default: 1 })
  capacityPerSlot: number; // max patients per slot (wave mode)

  // Stream-specific
  @Column({ type: 'int', default: 20 })
  dailyCapacity: number; // how many patients per day in stream mode

  @OneToOne(() => User, (user) => user.doctor, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;
  @OneToMany(() => Availability, (availability) => availability.doctor, { cascade: true })
availabilities: Availability[];
}
