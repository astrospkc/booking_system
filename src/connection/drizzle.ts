import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'

const client = postgres(process.env.SUPABASE_CONNECTION_STRING2)
const db = drizzle({ client });
export default db
