import assert from "node:assert/strict";
import test from "node:test";

import {
  getHealthStatus,
  maxTextLength,
  translateText,
  TranslationInputError,
} from "../server/translation.mjs";

test("health status reports the active translator", () => {
  assert.deepEqual(getHealthStatus(), {
    ok: true,
    translationStandard: "UEB-2024",
    translatorVersion: "liblouis-3.2.0",
  });
});

test("translation preserves the existing API response", () => {
  const result = translateText("with the people");

  assert.equal(result.grade1Braille, "⠺⠊⠞⠓ ⠞⠓⠑ ⠏⠑⠕⠏⠇⠑");
  assert.equal(result.grade2Braille, "⠾ ⠮ ⠏");
  assert.equal(result.translationMode, "remote");
  assert.deepEqual(result.notes, []);
});

test("translation rejects empty input", () => {
  assert.throws(
    () => translateText("  "),
    (error) =>
      error instanceof TranslationInputError && error.statusCode === 400,
  );
});

test("translation rejects input over the configured limit", () => {
  assert.throws(
    () => translateText("a".repeat(maxTextLength + 1)),
    (error) =>
      error instanceof TranslationInputError && error.statusCode === 413,
  );
});
