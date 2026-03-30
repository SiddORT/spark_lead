import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// ── CORS ────────────────────────────────────────────────────────────────────
// Allow the Vite dev server, the preview/published Replit domains, and any
// explicit FRONTEND_URL set in secrets.
const allowedOrigins: Array<string | RegExp> = [
  "http://localhost:5173",
  "http://localhost:3000",
  /\.repl\.co$/,
  /\.replit\.dev$/,
  /\.kirk\.repl\.co$/,
  /\.replit\.app$/,
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow no-origin requests (curl, Postman, server-to-server)
      if (!origin) return callback(null, true);

      const allowed = allowedOrigins.some((pattern) =>
        typeof pattern === "string" ? origin === pattern : pattern.test(origin),
      );

      if (allowed) return callback(null, true);

      logger.warn({ origin }, "CORS blocked origin");
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

// Handle preflight for all routes (Express 5 requires named wildcards)
app.options("/{*path}", cors() as any);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
