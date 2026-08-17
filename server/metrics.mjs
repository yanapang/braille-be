import client from "prom-client";

const register = new client.Registry();

client.collectDefaultMetrics({
  register,
  prefix: "braille_",
});

export const httpRequestsTotal = new client.Counter({
  name: "braille_http_requests_total",
  help: "Total HTTP requests.",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

export const httpRequestDurationSeconds = new client.Histogram({
  name: "braille_http_request_duration_seconds",
  help: "HTTP request duration in seconds.",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [register],
});

export const translateRequestsTotal = new client.Counter({
  name: "braille_translate_requests_total",
  help: "Total translation requests.",
  labelNames: ["outcome"],
  registers: [register],
});

export const translateDurationSeconds = new client.Histogram({
  name: "braille_translate_duration_seconds",
  help: "Translation duration in seconds.",
  labelNames: ["outcome"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [register],
});

export const translateInputLength = new client.Histogram({
  name: "braille_translate_input_length",
  help: "Input text length for translation requests.",
  labelNames: ["outcome"],
  buckets: [1, 10, 50, 100, 250, 500, 1000, 2500, 5000],
  registers: [register],
});

export function metricsMiddleware(request, response, next) {
  const start = process.hrtime.bigint();

  response.on("finish", () => {
    const durationSeconds = Number(process.hrtime.bigint() - start) / 1e9;
    const route = request.route?.path ?? request.path ?? "unknown";
    const labels = {
      method: request.method,
      route,
      status_code: String(response.statusCode),
    };

    httpRequestsTotal.inc(labels);
    httpRequestDurationSeconds.observe(labels, durationSeconds);
  });

  next();
}

export async function handleMetrics(_request, response) {
  response.set("Content-Type", register.contentType);
  response.end(await register.metrics());
}