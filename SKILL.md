---
name: text-legend-openclaw-deploy
description: "Set up, deploy, and manage Text-Legend game server using Docker Compose with MySQL or SQLite. Handles OpenClaw/Skillhub installation, container orchestration, database configuration, service health checks, and local Node.js development. Use when the user wants to run, start, stop, or troubleshoot Text-Legend services."
metadata: {"clawdbot":{"requires":{"anyBins":["docker"]},"os":["win32","linux","darwin"]}}
---

# Text-Legend Deployment Skill

Automate deployment and management of Text-Legend in this repository.

## Workflow

### 1. Install OpenClaw/Skillhub (only when user explicitly requests)

Warn the user that this downloads and runs a remote script before executing:

```bash
# Full install
curl -fsSL https://skillhub-1388575217.cos.ap-guangzhou.myqcloud.com/install/install.sh | bash

# CLI only
curl -fsSL https://skillhub-1388575217.cos.ap-guangzhou.myqcloud.com/install/install.sh | bash -s -- --cli-only
```

Remind the user to restart OpenClaw after installation to load Skillhub.

### 2. Verify Docker Environment

```bash
docker version
docker compose version
```

If `docker compose` is missing, prompt the user to upgrade Docker Desktop or install the Compose plugin. Do not proceed until both commands succeed.

### 3. Configure Database and Admin Account

Edit `docker-compose.mysql.yml` with the required environment variables:

- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `ADMIN_BOOTSTRAP_SECRET`, `ADMIN_BOOTSTRAP_USER`

If the user does not have MySQL, use the SQLite path (step 4b).

### 4. Start Services

**4a. MySQL:**

```bash
docker compose -f docker-compose.mysql.yml up -d
```

**4b. SQLite:**

```bash
docker compose up --build
```

### 5. Verify Deployment

Run a health check to confirm the service is responding:

```bash
curl -sf http://localhost:3000/ -o /dev/null && echo "Game server: OK" || echo "Game server: FAILED"
curl -sf http://localhost:3000/admin/ -o /dev/null && echo "Admin panel: OK" || echo "Admin panel: FAILED"
```

If either check fails:

1. Check container status: `docker compose ps`
2. Review logs: `docker logs -f text-legend`
3. Common issues: port 3000 already in use, missing environment variables, database connection refused.

### 6. Operations

- View logs: `docker logs -f text-legend`
- Stop (MySQL): `docker compose -f docker-compose.mysql.yml down`
- Stop (SQLite): `docker compose down`

### 7. Local Node.js Development (non-Docker)

Prerequisites: Node.js 24+ (LTS recommended), SQLite or MySQL available.

```bash
npm install
node src/index.js
```

For MySQL, set connection variables (`DB_CLIENT=mysql`, `DB_HOST`, etc.).
For SQLite, set: `DB_CLIENT=sqlite`, `DB_FILENAME=./data/game.sqlite`, `DB_POOL_MAX=1`.

Default port: `3000`.

## Important

- Only run remote install scripts when the user explicitly authorizes it.
- Never expose database passwords or GM keys in logs or output.
- For data persistence, confirm `./data` is mounted and writable.
