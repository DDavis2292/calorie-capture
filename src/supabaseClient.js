import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fzujjvcppzowjudqgjrw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dWpqdmNwcHpvd2p1ZHFnanJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MDI3MDQsImV4cCI6MjA4ODk3ODcwNH0.FV-r9SBeeurfEv0itBZo6VZPRqtbJsgxN2V8jTpRUS8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);