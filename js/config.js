// config.js
const SUPABASE_URL = 'https://gjncfgddamokgtckwyoq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqbmNmZ2RkYW1va2d0Y2t3eW9xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxMjYzNDcsImV4cCI6MjA3OTcwMjM0N30.E7saiTa9yAMDfMKZTusG99rxLcHFdXcMvqXw_5kjEYE';

window.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
