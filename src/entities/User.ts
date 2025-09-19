import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from "typeorm";
import { Doctor } from "./Doctor";
import { Patient } from "./Patient";

@Entity()
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ type: "varchar", nullable: true })
  password: string | null;

  @Column({ default: "google" })
  provider: string;

  @Column({ type: "enum", enum: ["doctor", "patient"], default: "patient" })
  role: "doctor" | "patient";

  @OneToOne(() => Doctor, doctor => doctor.user)
  doctor: Doctor;

  @OneToOne(() => Patient, patient => patient.user)
  patient: Patient;
}
