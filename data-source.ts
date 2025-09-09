import { DataSource } from 'typeorm';
import { User } from './src/entities/User';
import { Doctor } from './src/entities/Doctor';
import { Patient } from './src/entities/Patient';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5433,
  username: 'clinic_user',  
  password: 'mypassword',
  database: 'clinic_db',
  entities: [User, Doctor, Patient],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,  
  logging: true,
});
