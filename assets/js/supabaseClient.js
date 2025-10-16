// /assets/js/supabaseClient.js

const SUPABASE_URL = 'https://ntccnkvpxrpwgxmiherf.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50Y2Nua3ZweHJwd2d4bWloZXJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MzgyODYsImV4cCI6MjA2ODQxNDI4Nn0.JncC2HbFHONVid0aRYXfFohMu5D_ORVwj0XgyQg3khc';

window.sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  },
  global: {
    headers: { 'x-client-info': 'vereint-app' }
  }
});