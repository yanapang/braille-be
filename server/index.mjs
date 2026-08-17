import cors from "cors";
import express from "express";
import morgan from "morgan";
import path from "node:path";
import { createRequire } from "node:module";

import {
  handleMetrics,
  metricsMiddleware,
  observeTranslation,
} from "./metrics.mjs";

const require = createRequire(import.meta.url);
const liblouis = require("liblouis");

const app = express();
const port = Number(process.env.PORT ?? process.env.TRANSLATOR_PORT ?? 8787);
const host = process.env.HOST ?? process.env.TRANSLATOR_HOST ?? "0.0.0.0";
const translatorVersion = `liblouis-${liblouis.version()}`;
const translationStandard = "UEB-2024";
const liblouisBuildDir = path.dirname(require.resolve("liblouis-build/package.json"));
const tableFolderPath = path.join(liblouisBuildDir, "tables");
const grade1Table = "tables/unicode.dis,tables/en-ueb-g1.ctb";
const grade2Table = "tables/unicode.dis,tables/en-ueb-g2.ctb";
const corsOrigin = process.env.CORS_ORIGIN?.split(",").map((value) => value.trim()).filter(Boolean) ?? true;

const logFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";

liblouis.enableOnDemandTableLoading(tableFolderPath);

app.use(metricsMiddleware);
app.use(morgan(logFormat));
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    translationStandard,
    translatorVersion,
  });
});

app.get("/metrics", handleMetrics);

app.post("/api/translate", (request, response) => {
  const text = typeof request.body?.text === "string" ? request.body.text : "";
  const translationStart = process.hrtime.bigint();

  if (!text.trim()) {
    observeTranslation("client_error", text.length, translationStart);

    response.status(400).json({ error: "Text is required for translation." });
    return;
  }

  try {
    const grade1Braille = liblouis.translateString(grade1Table, text);
    const grade2Braille = liblouis.translateString(grade2Table, text);

    if (!grade1Braille || !grade2Braille) {
      throw new Error("Translation returned no result.");
    }

    observeTranslation("success", text.length, translationStart);

    response.json({
      grade1Braille,
      grade2Braille,
      notes: [],
      translationStandard,
      translatorVersion,
      translationMode: "remote",
    });
  } catch (error) {
    observeTranslation("server_error", text.length, translationStart);

    response.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "The translation service could not produce a Grade 2 result.",
    });
  }
});

const server = app.listen(port, host, () => {
  console.log(`Braille translator API listening on http://${host}:${port}`);
});

server.on("error", (error) => {
  console.error(
    error instanceof Error
      ? `Braille translator API failed to start: ${error.message}`
      : "Braille translator API failed to start.",
  );
  process.exitCode = 1;
});
