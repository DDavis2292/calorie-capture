import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bssxcdmvwhtuiqwswepf.supabase.co';
const supabaseAnonKey = 'sb_publishable_PhUoCWeQzx0DJOxgfp2MrQ_Jy9QuWJG'; // Replace with your full publishable key

export const supabase = createClient(supabaseUrl, supabaseAnonKey);