# Braille Inspector Backend

Express + liblouis translation API for English UEB 2024 Braille output.

## Commands

```bash
pnpm install
pnpm dev
pnpm run dev:local
pnpm run docker:build
pnpm run docker:run
pnpm start
pnpm run start:local
pnpm test
```

## Runtime

- Default port: `8787`
- Default host: `0.0.0.0`
- Health check: `GET /api/health`
- Translate endpoint: `POST /api/translate`
- Prometheus metrics: `GET /metrics`
- Lambda handler: `lambda/handler.mjs`

HTTP requests are logged to standard output. Development uses Morgan's concise
`dev` format; production uses Apache combined format.

## Metrics

The `/metrics` endpoint exposes Prometheus-compatible process, HTTP, and
translation metrics with the `braille_` prefix. Translation requests are
categorized as `success`, `client_error`, or `server_error`.

Unknown request paths use the fixed `unmatched` route label to avoid creating
unbounded Prometheus time series.

## Environment Variables

- `PORT` — backend port
- `HOST` — bind host, for example `127.0.0.1` for local-only development
- `TRANSLATOR_PORT` — alternate backend port variable
- `TRANSLATOR_HOST` — alternate bind host variable
- `CORS_ORIGIN` — comma-separated allowed origins
- `MAX_TEXT_LENGTH` — maximum translation input length, default `5000`

Use `pnpm run dev:local` or `pnpm run start:local` if your local environment does not allow binding to `0.0.0.0`.

## Deployment

The production target is AWS Lambda behind API Gateway HTTP API. The Lambda
handler does not start Express and writes structured request logs without
including the translated source text. Express and `/metrics` remain available
for local development and container-based fallback deployments.

The deployment workflow uses GitHub OIDC, publishes an immutable Lambda
version, invokes its translation route, and only then moves the `live` alias. Set
these GitHub Actions repository variables after Terraform has created the
infrastructure:

- `AWS_REGION`
- `AWS_DEPLOY_ROLE_ARN`
- `AWS_LAMBDA_FUNCTION_NAME`

## Docker

Make sure Docker Desktop or another local Docker server is running.

Build the image with the `braille-backend:local` tag:

```bash
pnpm run docker:build
```

Run the container and publish the API at `http://localhost:8787`:

```bash
pnpm run docker:run
```

In another terminal, verify that the container is healthy:

```bash
curl http://localhost:8787/api/health
```

Press `Ctrl+C` in the container terminal to stop it. The container is removed
automatically after it stops, but the `braille-backend:local` image remains
available for subsequent runs.

## CI Template

GitHub Actions deployment workflow for this backend repo lives at:
- `.github/workflows/deploy-backend-lambda.yml`
