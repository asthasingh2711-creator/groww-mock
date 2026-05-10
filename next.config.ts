import path from "path";
import { config as loadEnv } from "dotenv";
import type { NextConfig } from "next";

// Load env so GROQ_API_KEY can live in repo root `.env` (same as Streamlit) or `web/.env.local`.
const webRoot = process.cwd();
loadEnv({ path: path.join(webRoot, "..", ".env") });
loadEnv({ path: path.join(webRoot, ".env") });
loadEnv({ path: path.join(webRoot, ".env.local"), override: true });

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
