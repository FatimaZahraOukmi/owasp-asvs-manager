import dotenv from "dotenv";
dotenv.config();

const env = {
  // Server
  PORT: parseInt(process.env.PORT || "3000"),
  NODE_ENV: process.env.NODE_ENV || "development",

  // Database
  DATABASE_URL: process.env.DATABASE_URL || "",

  // JWT - Minimum 32 caractères !
  JWT_SECRET:
    process.env.JWT_SECRET ||
    "votre-secret-jwt-tres-long-et-securise-32-caracteres-min!",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h",
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET || "default-refresh-secret-change-me",
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  // Security
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS || "12"),

  // OpenAI
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  OPENAI_MODEL: process.env.OPENAI_MODEL || "gpt-4",
  OPENAI_MAX_TOKENS: parseInt(process.env.OPENAI_MAX_TOKENS || "2000"),

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:4200",
  CORS_CREDENTIALS: process.env.CORS_CREDENTIALS === "true",

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000"),
  RATE_LIMIT_MAX_REQUESTS: parseInt(
    process.env.RATE_LIMIT_MAX_REQUESTS || "100",
  ),
  AI_RATE_LIMIT_MAX_REQUESTS: parseInt(
    process.env.AI_RATE_LIMIT_MAX_REQUESTS || "10",
  ),
};

// Validation
if (!env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

if (!env.JWT_SECRET || env.JWT_SECRET.includes("default")) {
  console.warn(
    "⚠️  WARNING: Using default JWT secret. Change this in production!",
  );
}

if (!env.OPENAI_API_KEY && env.NODE_ENV === "production") {
  throw new Error("OPENAI_API_KEY is required in production");
}

export default env;
