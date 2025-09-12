import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from "typeorm";
import { User } from "./User";

@Entity()
export class Doctor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  specialization: string;

  @Column()
  experience: number;

  @OneToOne(() => User, (user) => user.doctor, { onDelete: "CASCADE" })
  @JoinColumn()
  user: User;
}
