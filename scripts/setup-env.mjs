#!/usr/bin/env node
// Ensure server/.env exists before Prisma or the dev server runs.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(here, "..", "server", ".env");
const examplePath = path.join(here, "..", "server", ".env.example");

if (!fs.existsSync(envPath) && fs.existsSync(examplePath)) {
  fs.copyFileSync(examplePath, envPath);
  console.log("Created server/.env from .env.example");
}
