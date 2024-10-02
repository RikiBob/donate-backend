import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'donate',
  entities: [process.env.TYPEORM_ENTITIES],
  migrations: [process.env.TYPEORM_MIGRATIONS],
});

export default AppDataSource;
