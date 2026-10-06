import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const liblouis = require("liblouis");

const DEFAULT_MAX_TEXT_LENGTH = 5000;
const configuredMaxTextLength = Number(process.env.MAX_TEXT_LENGTH);
const liblouisBuildDir = path.dirname(
  require.resolve("liblouis-build/package.json"),
);
const tableFolderPath = path.join(liblouisBuildDir, "tables");
const grade1Table = "tables/unicode.dis,tables/en-ueb-g1.ctb";
const grade2Table = "tables/unicode.dis,tables/en-ueb-g2.ctb";

export const maxTextLength =
  Number.isInteger(configuredMaxTextLength) && configuredMaxTextLength > 0
    ? configuredMaxTextLength
    : DEFAULT_MAX_TEXT_LENGTH;
export const translationStandard = "UEB-2024";
export const translatorVersion = `liblouis-${liblouis.version()}`;

liblouis.enableOnDemandTableLoading(tableFolderPath);

export class TranslationInputError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "TranslationInputError";
    this.statusCode = statusCode;
  }
}

export function getHealthStatus() {
  return {
    ok: true,
    translationStandard,
    translatorVersion,
  };
}

export function translateText(text) {
  if (typeof text !== "string" || !text.trim()) {
    throw new TranslationInputError("Text is required for translation.");
  }

  if (text.length > maxTextLength) {
    throw new TranslationInputError(
      `Text must be ${maxTextLength} characters or fewer.`,
      413,
    );
  }

  const grade1Braille = liblouis.translateString(grade1Table, text);
  const grade2Braille = liblouis.translateString(grade2Table, text);

  if (!grade1Braille || !grade2Braille) {
    throw new Error("Translation returned no result.");
  }

  return {
    grade1Braille,
    grade2Braille,
    notes: [],
    translationStandard,
    translatorVersion,
    translationMode: "remote",
  };
}
