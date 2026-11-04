import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ekdejphsvfedbuulxmit.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZGVqcGhzdmZlZGJ1dWx4bWl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxNDg3NzcsImV4cCI6MjEwODcyNDc3N30.mBeWR_t6eVV3rObcpBgRxGYHuuan4FX7T59y4yr4CuI'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
