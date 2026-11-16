import 'dotenv/config';
import { runMigrations } from '../src/db/migrate';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is required to run migrations');
  process.exit(1);
}

runMigrations(connectionString)
  .then(() => {
    console.log('Migrations complete');
  })
  .catch((error) => {
    console.error('Migration failed', error);
    process.exit(1);
  });
