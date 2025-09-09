import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from "typeorm";
import { Doctor } from "./Doctor";
import { Patient } from "./Patient";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column()
  password: string;

  // A user can be either a doctor or a patient
  @OneToOne(() => Doctor, doctor => doctor.user)
  doctor: Doctor;

  @OneToOne(() => Patient, patient => patient.user)
  patient: Patient;
}
