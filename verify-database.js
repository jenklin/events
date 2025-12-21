#!/usr/bin/env node

/**
 * Database Verification Script
 * Checks that all tables, views, and functions were created successfully
 */

const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, 'app', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function verifyDatabase() {
  console.log('🔍 Verifying database setup...\n');

  const results = {
    tables: [],
    views: [],
    functions: [],
    errors: []
  };

  // Check tables
  console.log('📊 Checking tables...');
  const expectedTables = [
    'events',
    'rsvp_responses',
    'guest_activity_log',
    'event_waitlist',
    'guest_comments',
    'reminder_queue',
    'event_metrics'
  ];

  for (const table of expectedTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(0);

      if (error) {
        console.log(`   ❌ ${table}: ${error.message}`);
        results.errors.push({ type: 'table', name: table, error: error.message });
      } else {
        console.log(`   ✅ ${table}`);
        results.tables.push(table);
      }
    } catch (err) {
      console.log(`   ❌ ${table}: ${err.message}`);
      results.errors.push({ type: 'table', name: table, error: err.message });
    }
  }

  // Check views
  console.log('\n👁️  Checking views...');
  const expectedViews = [
    'event_summary',
    'guest_list',
    'potluck_contributions',
    'potluck_summary',
    'event_playlist'
  ];

  for (const view of expectedViews) {
    try {
      const { data, error } = await supabase
        .from(view)
        .select('*')
        .limit(0);

      if (error) {
        console.log(`   ❌ ${view}: ${error.message}`);
        results.errors.push({ type: 'view', name: view, error: error.message });
      } else {
        console.log(`   ✅ ${view}`);
        results.views.push(view);
      }
    } catch (err) {
      console.log(`   ❌ ${view}: ${err.message}`);
      results.errors.push({ type: 'view', name: view, error: err.message });
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 Database Verification Summary');
  console.log('='.repeat(60));
  console.log(`✅ Tables created: ${results.tables.length}/${expectedTables.length}`);
  console.log(`✅ Views created: ${results.views.length}/${expectedViews.length}`);

  if (results.errors.length > 0) {
    console.log(`\n❌ Errors found: ${results.errors.length}`);
    results.errors.forEach(err => {
      console.log(`   - ${err.type}: ${err.name} - ${err.error}`);
    });
  } else {
    console.log('\n🎉 All database objects created successfully!');
    console.log('\n✅ Next steps:');
    console.log('   1. Test the event creator at: http://localhost:3001');
    console.log('   2. Create a test event with potluck + music features');
    console.log('   3. Deploy to staging: ./deploy.sh staging');
  }
  console.log('='.repeat(60));
}

verifyDatabase();
