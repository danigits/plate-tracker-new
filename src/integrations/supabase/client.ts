// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://qcmiefuvhorthdkziyvj.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjbWllZnV2aG9ydGhka3ppeXZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY0MDg0NzQsImV4cCI6MjA2MTk4NDQ3NH0.KBBDLUGdcNVIjsFTiFN0EgaW_4Mxx17VL1ugs-6aF3Y";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);