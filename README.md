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

Build the local image:

```bash
pnpm run docker:build
```

Run it at `http://localhost:8787`:

```bash
pnpm run docker:run
curl http://localhost:8787/api/health
```

## CI Template

GitHub Actions template for this backend repo lives at:
- `.github/workflows/deploy-backend-ec2.yml`
