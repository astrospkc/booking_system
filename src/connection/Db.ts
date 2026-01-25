import { createClient } from "@supabase/supabase-js"
import "dotenv/config"

// Create a single supabase client for interacting with your database
const supabase = createClient(process.env.SUPABASE_PROJECT_URL!, process.env.SUPABASE_ANON_KEY!)

export default supabase