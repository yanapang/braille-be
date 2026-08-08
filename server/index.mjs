import cors from "cors";
import express from "express";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const liblouis = require("liblouis");

const app = express();
const port = Number(process.env.PORT ?? process.env.TRANSLATOR_PORT ?? 8787);
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

app.get("/api/health", (_request, response) => {
  response.json({
    ok: true,
    translationStandard,
    translatorVersion,
  });
});

app.post("/api/translate", (request, response) => {
  const text = typeof request.body?.text === "string" ? request.body.text : "";
  const normalized = text.trim();

  if (!normalized) {
    response.status(400).json({ error: "Text is required for translation." });
    return;
  }

  try {
    const grade1Braille = liblouis.translateString(grade1Table, text);
    const grade2Braille = liblouis.translateString(grade2Table, text);

    if (!grade1Braille || !grade2Braille) {
      throw new Error("Translation returned no result.");
    }

    response.json({
      grade1Braille,
      grade2Braille,
      notes: [],
      translationStandard,
      translatorVersion,
      translationMode: "remote",
    });
  } catch (error) {
    response.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "The translation service could not produce a Grade 2 result.",
    });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Braille translator API listening on http://0.0.0.0:${port}`);
});
