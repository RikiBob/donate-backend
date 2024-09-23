import { DataSource } from 'typeorm';
// import { ConfigService } from '@nestjs/config';

// const configService = new ConfigService();

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
// async function initializeDataSource() {
//   try {
//     await AppDataSource.initialize();
//     console.log('Data Source has been initialized!');
//   } catch (error) {
//     console.error('Error during Data Source initialization:', error);
//   }
// }
//
// initializeDataSource();


