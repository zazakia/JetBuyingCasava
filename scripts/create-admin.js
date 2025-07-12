#!/usr/bin/env node

// Script to create an admin user for JetAgriTracker
// Usage: node scripts/create-admin.js

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminUser() {
  const adminEmail = 'test@test.com';
  const adminPassword = 'admin123456';
  
  console.log('🚀 Creating admin user...');
  console.log(`📧 Email: ${adminEmail}`);
  console.log(`🔑 Password: ${adminPassword}`);
  
  try {
    // Step 1: Register the user
    console.log('\n1️⃣ Registering user...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: adminEmail,
      password: adminPassword,
      options: {
        data: {
          first_name: 'Admin',
          last_name: 'User',
          role: 'user' // Will be promoted to admin
        }
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('✅ User already exists, proceeding to promotion...');
      } else {
        throw authError;
      }
    } else {
      console.log('✅ User registered successfully');
    }

    // Step 2: Promote to admin
    console.log('\n2️⃣ Promoting to admin...');
    const { error: promoteError } = await supabase.rpc('create_admin_user', {
      admin_email: adminEmail
    });

    if (promoteError) {
      throw promoteError;
    }

    console.log('✅ User promoted to admin successfully');
    
    console.log('\n🎉 Admin user created successfully!');
    console.log('\n📋 Login credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('\n⚠️  Please change the password after first login!');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  }
}

createAdminUser();
