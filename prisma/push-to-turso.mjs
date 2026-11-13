import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const url = process.env.TURSO_DATABASE_URL || 'libsql://citynova-db-tarique-104.turso.io';
  const authToken = process.env.TURSO_AUTH_TOKEN || process.argv[2];

  if (!authToken) {
    console.error('\n❌ Missing Turso Auth Token!');
    console.error('Usage: node prisma/push-to-turso.mjs <YOUR_TURSO_AUTH_TOKEN>');
    console.error('Or set TURSO_AUTH_TOKEN in your environment.\n');
    process.exit(1);
  }

  console.log(`\nConnecting to Turso: ${url}...`);
  const client = createClient({ url, authToken });

  const sqlPath = path.join(__dirname, 'turso-init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  console.log(`Executing ${statements.length} schema statements in dependency order...`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      await client.execute(stmt);
    } catch (err) {
      console.error(`Error on statement #${i + 1}:`, stmt.slice(0, 60), err.message);
      throw err;
    }
  }

  console.log('✅ Successfully initialized all tables and indexes on Turso!');
}

main().catch((err) => {
  console.error('\n❌ Migration failed:', err);
  process.exit(1);
});

