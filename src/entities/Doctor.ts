import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity()
export class Doctor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  specialization: string;

  @OneToOne(() => User, user => user.doctor)
  @JoinColumn() // this side owns the relationship
  user: User;
}
