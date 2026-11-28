import express from "express";
import type { Server } from "http";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { handleRender } from "./http/render.js";

export const createApp = (): express.Express => {
  const app = express();

  // JSON in, MP4 out. See README "HTTP service".
  app.post("/render", express.json({ limit: "20mb" }), handleRender);

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      uptime: process.uptime(),
      version: process.env.npm_package_version,
    });
  });

  return app;
};

export const startServer = (port: number = env.PORT): Server => {
  const app = createApp();
  const server = app.listen(port, () => {
    const address = server.address();
    logger.info({ port: typeof address === "object" && address ? address.port : port }, "Server started");
  });

  const terminationSignals: NodeJS.Signals[] = ["SIGTERM", "SIGINT"];

  terminationSignals.forEach((signal) => {
    process.on(signal, () => {
      logger.info({ signal }, "Received shutdown signal");
      server.close(() => {
        logger.info("HTTP server closed");
        process.exit(0);
      });
    });
  });

  return server;
};
