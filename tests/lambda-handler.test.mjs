import assert from "node:assert/strict";
import test from "node:test";

import { handler } from "../lambda/handler.mjs";
import { maxTextLength } from "../server/translation.mjs";

function apiEvent(method, path, body) {
  return {
    version: "2.0",
    rawPath: path,
    body,
    requestContext: {
      requestId: "test-request",
      http: { method, path },
    },
  };
}

test("Lambda health route responds successfully", async () => {
  const response = await handler(apiEvent("GET", "/api/health"));

  assert.equal(response.statusCode, 200);
  assert.equal(JSON.parse(response.body).ok, true);
});

test("Lambda translate route returns Braille", async () => {
  const response = await handler(
    apiEvent("POST", "/api/translate", JSON.stringify({ text: "with" })),
  );
  const body = JSON.parse(response.body);

  assert.equal(response.statusCode, 200);
  assert.equal(body.grade2Braille, "⠾");
});

test("Lambda rejects malformed JSON", async () => {
  const response = await handler(apiEvent("POST", "/api/translate", "{"));

  assert.equal(response.statusCode, 400);
  assert.match(JSON.parse(response.body).error, /valid JSON/);
});

test("Lambda rejects oversized input", async () => {
  const response = await handler(
    apiEvent(
      "POST",
      "/api/translate",
      JSON.stringify({ text: "a".repeat(maxTextLength + 1) }),
    ),
  );

  assert.equal(response.statusCode, 413);
});

test("Lambda returns JSON for unknown routes", async () => {
  const response = await handler(apiEvent("GET", "/missing"));

  assert.equal(response.statusCode, 404);
  assert.equal(
    response.headers["content-type"],
    "application/json; charset=utf-8",
  );
});
