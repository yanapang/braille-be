# Braille Inspector Backend

Express + liblouis translation API for English UEB 2024 Braille output.

## Commands

```bash
pnpm install
pnpm dev
pnpm start
```

## Runtime

- Default port: `8787`
- Health check: `GET /api/health`
- Translate endpoint: `POST /api/translate`

## Environment Variables

- `PORT` — backend port
- `CORS_ORIGIN` — comma-separated allowed origins

## Deployment

Recommended AWS deployment:
- build Docker image
- push image to registry
- deploy on EC2 with Docker
- put Nginx in front if you need domain routing and TLS termination

## Docker

Build image from this directory:

```bash
docker build -t braille-backend .
```

## CI Template

GitHub Actions template for this backend repo lives at:
- `.github/workflows/deploy-backend-ec2.yml`
