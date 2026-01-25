import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
// Create a single supabase client for interacting with your database
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
console.log("supabase", supabase);
if (!supabase) {
    console.error("Supabase client not initialized");
    // throw new Error("Supabase client not initialized")
}
export default supabase;
//# sourceMappingURL=Db.js.map