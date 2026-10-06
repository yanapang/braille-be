import {
  getHealthStatus,
  translateText,
  TranslationInputError,
} from "../server/translation.mjs";

const jsonHeaders = {
  "cache-control": "no-store",
  "content-type": "application/json; charset=utf-8",
};

function jsonResponse(statusCode, body) {
  return {
    statusCode,
    headers: jsonHeaders,
    body: JSON.stringify(body),
  };
}

function parseBody(event) {
  if (!event.body) {
    return {};
  }

  const body = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf8")
    : event.body;

  return JSON.parse(body);
}

function writeRequestLog({
  event,
  method,
  path,
  statusCode,
  outcome,
  startedAt,
  inputLength,
}) {
  const logEntry = {
    type: "api_request",
    requestId: event.requestContext?.requestId,
    method,
    path,
    statusCode,
    outcome,
    durationMs: Number(process.hrtime.bigint() - startedAt) / 1e6,
  };

  if (inputLength !== undefined) {
    logEntry.inputLength = inputLength;
  }

  console.log(JSON.stringify(logEntry));
}

export async function handler(event) {
  const startedAt = process.hrtime.bigint();
  const method =
    event.requestContext?.http?.method ?? event.httpMethod ?? "UNKNOWN";
  const path = event.rawPath ?? event.path ?? "/";
  let response;
  let outcome = "not_found";
  let inputLength;

  if (method === "GET" && path === "/api/health") {
    response = jsonResponse(200, getHealthStatus());
    outcome = "success";
  } else if (method === "POST" && path === "/api/translate") {
    let payload;

    try {
      payload = parseBody(event);
    } catch {
      response = jsonResponse(400, { error: "Request body must be valid JSON." });
      outcome = "client_error";
    }

    if (!response) {
      const text = payload?.text;
      inputLength = typeof text === "string" ? text.length : 0;

      try {
        response = jsonResponse(200, translateText(text));
        outcome = "success";
      } catch (error) {
        if (error instanceof TranslationInputError) {
          response = jsonResponse(error.statusCode, { error: error.message });
          outcome = "client_error";
        } else {
          console.error(
            JSON.stringify({
              type: "translation_error",
              requestId: event.requestContext?.requestId,
              errorName: error instanceof Error ? error.name : "UnknownError",
              errorMessage:
                error instanceof Error ? error.message : "Translation failed.",
            }),
          );
          response = jsonResponse(500, {
            error: "The translation service could not produce a result.",
          });
          outcome = "server_error";
        }
      }
    }
  } else {
    response = jsonResponse(404, { error: "Route not found." });
  }

  writeRequestLog({
    event,
    method,
    path,
    statusCode: response.statusCode,
    outcome,
    startedAt,
    inputLength,
  });

  return response;
}
