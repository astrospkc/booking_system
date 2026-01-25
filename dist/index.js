import express from "express";
import dotenv from "dotenv";
import supabase from "./connection/Db.js";
dotenv.config();
const app = express();
// console.log("supabase", supabase)
app.listen(3000, () => {
    console.log("Server started on port 3000");
});
//# sourceMappingURL=index.js.map