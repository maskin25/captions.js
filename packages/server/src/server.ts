import express from "express";
import type { Server } from "http";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

export const createApp = () => {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({
      status: "ok",
      uptime: process.uptime(),
      version: process.env.npm_package_version,
    });
  });

  app.post("/burnCaptions", (req, res) => {
    console.log("Headers:", req.headers);
    console.log("Body:", JSON.stringify(req.body, null, 2));
    res.status(200).send(JSON.stringify(req.body, null, 2));
  });

  return app;
};

export const startServer = (): Server => {
  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, "Server started");
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
