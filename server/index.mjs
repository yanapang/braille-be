import cors from "cors";
import express from "express";
import path from "node:path";
import { createRequire } from "node:module";

/** metrics */
import {
  handleMetrics,
  metricsMiddleware,
  translateDurationSeconds,
  translateInputLength,
  translateRequestsTotal,
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

liblouis.enableOnDemandTableLoading(tableFolderPath);

app.use(cors({ origin: corsOrigin }));
app.use(express.json());
app.use(metricsMiddleware);

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
  const normalized = text.trim();

  /** metric  */
  const translationStart = process.hrtime.bigint();

  if (!normalized) {
    translateRequestsTotal.inc({ outcome: "client_error" });
    translateInputLength.observe({ outcome: "client_error" }, text.length);
    translateDurationSeconds.observe(
      { outcome: "client_error" },
      Number(process.hrtime.bigint() - translationStart) / 1e9,
    );

    response.status(400).json({ error: "Text is required for translation." });
    return;
  }

  try {
    const grade1Braille = liblouis.translateString(grade1Table, text);
    const grade2Braille = liblouis.translateString(grade2Table, text);

    if (!grade1Braille || !grade2Braille) {
      throw new Error("Translation returned no result.");
    }

    translateRequestsTotal.inc({ outcome: "success" });
    translateInputLength.observe({ outcome: "success" }, text.length);
    translateDurationSeconds.observe(
      { outcome: "success" },
      Number(process.hrtime.bigint() - translationStart) / 1e9,
    );


    response.json({
      grade1Braille,
      grade2Braille,
      notes: [],
      translationStandard,
      translatorVersion,
      translationMode: "remote",
    });
  } catch (error) {
    translateRequestsTotal.inc({ outcome: "server_error" });
    translateInputLength.observe({ outcome: "server_error" }, text.length);
    translateDurationSeconds.observe(
      { outcome: "server_error" },
      Number(process.hrtime.bigint() - translationStart) / 1e9,
    );
    
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
