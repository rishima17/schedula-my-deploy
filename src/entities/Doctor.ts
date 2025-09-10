import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from "typeorm"
import { User } from "./User"

@Entity()
export class Doctor {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  specialization: string

  @Column()
  experienceYears: number

  @OneToOne(() => User, user => user.doctor)
  @JoinColumn() // owner side of relation
  user: User
}
