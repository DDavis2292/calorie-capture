import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bssxcdmvwhtuiqwswepf.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzc3hjZG12d2h0dWlxd3N3ZXBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMzExMDYsImV4cCI6MjA4ODkwNzEwNn0.WyafM8Qt_SEAVHji0GWjoRmb2RQKsy7P6R9SokrnXys'; // Should start with eyJ

export const supabase = createClient(supabaseUrl, supabaseAnonKey);