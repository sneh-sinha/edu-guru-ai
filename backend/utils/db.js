const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
let supabase = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error.message);
  }
} else {
  console.log('Supabase credentials missing. Database operations will be mocked.');
}

module.exports = supabase;
