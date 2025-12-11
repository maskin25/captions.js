import express from "express";
import type { Server } from "http";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { burnCaptions } from "./render/burnCaptions.js";

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

  type RenderJobPayload = {
    preset: string;
    video_uri: string;
    captions_uri: string;
    output_uri: string;
  };

  app.post("/burnCaptions", async (req, res) => {
    const envelope = req.body;
    const message = envelope?.message;

    if (!message || !message.data) {
      console.error("No message data");
      return res.status(400).send("No message data");
    }

    const decoded = Buffer.from(message.data, "base64").toString("utf8");

    let payload: RenderJobPayload;
    try {
      payload = JSON.parse(decoded);
    } catch (e) {
      console.error("Invalid JSON payload", e, decoded);
      return res.status(400).send("Invalid JSON payload");
    }

    console.log("Got render job:", payload);

    await burnCaptions({
      preset: payload.preset,
      video: payload.video_uri,
      captions: payload.captions_uri,
      output: payload.output_uri,
    });

    res.status(200).send("OK");
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
