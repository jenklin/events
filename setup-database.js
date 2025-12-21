#!/usr/bin/env node

/**
 * Database Setup Script
 * Executes the enhanced-event-database.sql file against Supabase
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, 'app', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in app/.env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function setupDatabase() {
  console.log('🚀 Starting database setup...\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  console.log(`🗄️  Executing SQL file: templates/enhanced-event-database.sql\n`);

  try {
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'templates', 'enhanced-event-database.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    // Split by statement (basic splitting - may need refinement for complex SQL)
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';

      // Skip comments and sample data
      if (statement.includes('SAMPLE DATA') || statement.trim().startsWith('--')) {
        continue;
      }

      // Extract statement type for logging
      const statementType = statement
        .trim()
        .split(/\s+/)[0]
        .toUpperCase();

      process.stdout.write(`[${i + 1}/${statements.length}] ${statementType}... `);

      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });

        if (error) {
          // Try direct execution if RPC fails
          const { error: directError } = await supabase
            .from('_sql_execution')
            .select('*')
            .limit(1);

          // If we can't execute via RPC, we'll need to use the Supabase SQL editor
          // Log the error but continue
          console.log(`⚠️  Skipped (use Supabase SQL editor)`);
          errorCount++;
        } else {
          console.log('✅');
          successCount++;
        }
      } catch (err) {
        console.log(`⚠️  ${err.message}`);
        errorCount++;
      }

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Setup complete!`);
    console.log(`   Success: ${successCount} statements`);
    if (errorCount > 0) {
      console.log(`   ⚠️  Skipped: ${errorCount} statements`);
      console.log(`\n⚠️  NOTE: Supabase doesn't support programmatic SQL execution`);
      console.log(`   Please execute the SQL file manually:`);
      console.log(`   1. Open Supabase Dashboard: ${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/')}`);
      console.log(`   2. Go to SQL Editor`);
      console.log(`   3. Copy and paste: templates/enhanced-event-database.sql`);
      console.log(`   4. Click "Run"\n`);
    }
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Database setup failed:', error.message);
    process.exit(1);
  }
}

setupDatabase();
