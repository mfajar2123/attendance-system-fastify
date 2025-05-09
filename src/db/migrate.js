'use strict';

const { migrate } = require('drizzle-orm/node-postgres/migrator');
const { db } = require('./connection');


async function runMigrations() {
  console.log('Starting database migrations...');
  
  try {
    await migrate(db, { migrationsFolder: 'drizzle' });
    console.log('Migrations completed successfully');
    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    return false;
  }
}

if (require.main === module) {
  runMigrations()
    .then(success => {
      if (success) {
        console.log('Migration process complete');
        process.exit(0);
      } else {
        console.error('Migration process failed');
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Unexpected error during migration:', err);
      process.exit(1);
    });
}

module.exports = { runMigrations };