import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import dotenv from 'dotenv'
dotenv.config()

const client = postgres(process.env.SUPABASE_CONNECTION_STRING2!, {
    ssl: "require"
})

const db = drizzle(client);
export default db
