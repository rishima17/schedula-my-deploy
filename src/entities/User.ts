import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from "typeorm"
import { Doctor } from "./Doctor"
import { Patient } from "./Patient"

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  name: string

  @Column({ unique: true })
  email: string

  @Column()
  password: string

  // Relationships
  @OneToOne(() => Doctor, doctor => doctor.user)
  doctor: Doctor

  @OneToOne(() => Patient, patient => patient.user)
  patient: Patient
}
