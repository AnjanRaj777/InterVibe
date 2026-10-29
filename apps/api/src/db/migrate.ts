import "../env.js";
import { loadConfig } from "../config.js";
import { migrate } from "./pool.js";

const { DATABASE_URL } = loadConfig();
const applied = await migrate(DATABASE_URL);
console.log(`Applied migrations: ${applied.join(", ") || "(none)"}`);
