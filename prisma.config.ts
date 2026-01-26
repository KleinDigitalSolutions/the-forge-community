import fs from "node:fs";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

const envLocalPath = new URL(".env.local", import.meta.url);
const envPath = new URL(".env", import.meta.url);

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const rawUrl =
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL;

if (!rawUrl) {
  throw new Error("Missing database URL for Prisma config.");
}

// Robust URL reconstruction
let stableUrl;
try {
  // Parse URL to verify components
  const urlObj = new URL(rawUrl);
  
  // FORCE IP OVERRIDE
  // Using direct IP 63.179.28.86 for ep-shiny-heart-agvjkvj5.c-2.eu-central-1.aws.neon.tech
  urlObj.hostname = "63.179.28.86";
  
  // FORCE SSL SETTINGS
  // Neon requires SSL, but local tools often fail full verification.
  // 'require' ensures encryption without strictly checking the CA chain against the IP.
  urlObj.searchParams.set("sslmode", "require");
  urlObj.searchParams.set("connect_timeout", "30"); // Increased timeout
  
  stableUrl = urlObj.toString();
  
} catch (e) {
  console.error("Failed to parse database URL, falling back to string replacement:", e);
  stableUrl = rawUrl
    .replace("sslmode=verify-full", "sslmode=require")
    .replace("ep-shiny-heart-agvjkvj5.c-2.eu-central-1.aws.neon.tech", "63.179.28.86");
}

console.log(`🔌 Prisma Config forcing IP: 63.179.28.86 (masked: ${stableUrl.replace(/:([^:@]+)@/, ':****@')})`);

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: stableUrl,
  },
});