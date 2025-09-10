import "reflect-metadata";
import { DataSource } from "typeorm";

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "root1234",
  database: "PearlThoughts",
  synchronize: false,
  logging: true,
  entities: [__dirname + "/entities/*.{ts,js}"],   // glob pattern works both in dev/prod
  migrations: [__dirname + "/migrations/*.{ts,js}"],
});
