import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes";
import { errorHandler } from "./middleware/error.handler";
import env from "./config/env";
import chatRoutes from "./routes/chat.routes";

const app = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: env.CORS_CREDENTIALS,
  }),
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// API routes (auth middleware est dans routes/index.ts)
app.use("/api", routes);

// Chat routes (APRÈS /api pour que l'auth soit déjà chargée)
// Le middleware authenticate est déjà dans chat.routes.ts
app.use("/api/chat", chatRoutes);

app.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "Route non trouvée",
    },
  });
});

// Error handler
app.use(errorHandler);
app.set("etag", false);
app.disable("etag");

// Start server
const PORT = env.PORT;
app.listen(PORT, () => {
  console.log(`
🚀 OWASP ASVS Manager API
📡 Port: ${PORT}
🌍 Environment: ${env.NODE_ENV}
  `);
});

export default app;
