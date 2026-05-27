// backend/supabaseClient.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mhzuhpuhymhiklfsehnd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oenVocHVoeW1oaWtsZnNlaG5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2Mzg2MTMsImV4cCI6MjA5NDIxNDYxM30.zrND5FmYnRPEzJGUr2ELPxc585uaPx23YoAGZPz7zK8';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERROR: Faltan las variables de entorno de Supabase en el archivo .env");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = supabase;