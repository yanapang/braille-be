import cors from "cors";
import express from "express";
import morgan from "morgan";

import {
  handleMetrics,
  metricsMiddleware,
  observeTranslation,
} from "./metrics.mjs";
import {
  getHealthStatus,
  translateText,
  TranslationInputError,
} from "./translation.mjs";

const app = express();
const port = Number(process.env.PORT ?? process.env.TRANSLATOR_PORT ?? 8787);
const host = process.env.HOST ?? process.env.TRANSLATOR_HOST ?? "0.0.0.0";
const corsOrigin = process.env.CORS_ORIGIN?.split(",").map((value) => value.trim()).filter(Boolean) ?? true;

const logFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";

app.use(metricsMiddleware);
app.use(morgan(logFormat));
app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json(getHealthStatus());
});

app.get("/metrics", handleMetrics);

app.post("/api/translate", (request, response) => {
  const text = request.body?.text;
  const inputLength = typeof text === "string" ? text.length : 0;
  const translationStart = process.hrtime.bigint();

  try {
    const translation = translateText(text);
    observeTranslation("success", inputLength, translationStart);
    response.json(translation);
  } catch (error) {
    if (error instanceof TranslationInputError) {
      observeTranslation("client_error", inputLength, translationStart);
      response.status(error.statusCode).json({ error: error.message });
      return;
    }

    observeTranslation("server_error", inputLength, translationStart);
    console.error(error);

    response.status(500).json({
      error: "The translation service could not produce a result.",
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
