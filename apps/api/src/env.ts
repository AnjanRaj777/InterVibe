import { config } from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Loads the monorepo-root .env. npm runs workspace scripts with cwd set to
 * the package dir, so dotenv's default cwd lookup would miss the root file.
 */
config({ path: join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", ".env") });
