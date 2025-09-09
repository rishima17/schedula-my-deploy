import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from "typeorm"
import { User } from "./User"

@Entity()
export class Patient {
  @PrimaryGeneratedColumn()
  id: number

  @Column()
  age: number

  @Column()
  disease: string

  @OneToOne(() => User, user => user.patient)
  @JoinColumn()
  user: User
}
