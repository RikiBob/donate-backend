import { DataSource } from 'typeorm';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'postgres',
  database: 'donate',
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/migrations/*.js'],
});

export default AppDataSource;
