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
```

## Runtime

- Default port: `8787`
- Default host: `0.0.0.0`
- Health check: `GET /api/health`
- Translate endpoint: `POST /api/translate`
- Prometheus metrics: `GET /metrics`

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

Use `pnpm run dev:local` or `pnpm run start:local` if your local environment does not allow binding to `0.0.0.0`.

## Deployment

Recommended AWS deployment:
- build Docker image
- push image to registry
- deploy on EC2 with Docker
- put Nginx in front if you need domain routing and TLS termination

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

GitHub Actions template for this backend repo lives at:
- `.github/workflows/deploy-backend-ec2.yml`
