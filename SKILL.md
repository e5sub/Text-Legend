---
name: text-legend-openclaw-deploy
description: Install OpenClaw/Skillhub (if needed) and deploy Text-Legend with Docker Compose (MySQL/SQLite), including start/stop and health checks.
metadata: {"clawdbot":{"requires":{"anyBins":["docker"]},"os":["win32","linux","darwin"]}}
---

# Text-Legend OpenClaw 部署技能

本技能用于在本仓库中自动化部署与运行 Text-Legend。覆盖以下任务：

- 安装 OpenClaw/Skillhub（仅在用户明确要求时）
- 检查 Docker 与 Compose 环境
- 填充 `docker-compose.mysql.yml` 的数据库配置
- 启动与停止服务
- 基本访问验证与日志查看
- 本地 npm 运行（非 Docker）

## 触发场景

- 用户希望用 OpenClaw 自动部署/运行本项目
- 用户需要一键启动（MySQL 或 SQLite）
- 用户需要标准化的启动/停止/日志命令

## 操作流程

### 1. 安装 OpenClaw/Skillhub（仅在用户要求时）

如果用户明确要安装 OpenClaw 生态或 Skillhub，提供以下命令并提醒会下载远程脚本：

```bash
curl -fsSL https://skillhub-1388575217.cos.ap-guangzhou.myqcloud.com/install/install.sh | bash
```

仅安装 CLI：

```bash
curl -fsSL https://skillhub-1388575217.cos.ap-guangzhou.myqcloud.com/install/install.sh | bash -s -- --cli-only
```

安装后提醒用户重启 OpenClaw 以加载 Skillhub。

### 2. 环境检查

确认 Docker 可用：

```bash
docker version
docker compose version
```

若 `docker compose` 不存在，提示用户升级 Docker Desktop 或安装 Compose 插件。

### 3. 配置数据库与后台账号

编辑 `docker-compose.mysql.yml`，填入以下环境变量：

- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `ADMIN_BOOTSTRAP_SECRET`
- `ADMIN_BOOTSTRAP_USER`

若用户没有 MySQL，改用 SQLite 流程：

```bash
docker compose up --build
```

### 4. 启动服务（MySQL）

```bash
docker compose -f docker-compose.mysql.yml up -d
```

### 5. 访问验证

- 游戏：`http://localhost:3000/`
- 后台：`http://localhost:3000/admin/`

### 6. 常用运维

- 查看日志：`docker logs -f text-legend`
- 停止服务：`docker compose -f docker-compose.mysql.yml down`

### 7. 本地 npm 运行（非 Docker）

前置条件：

- Node.js 24+（建议 LTS）
- 可用的 SQLite 或 MySQL

步骤：

```bash
npm install
node src/index.js
```

若使用 MySQL，确保已通过环境变量提供连接信息（`DB_CLIENT=mysql` 等）。
若使用 SQLite，建议设置：

- `DB_CLIENT=sqlite`
- `DB_FILENAME=/app/data/game.sqlite`（可按本地路径调整）
- `DB_POOL_MAX=1`

默认端口：`3000`。

## 注意事项

- 仅在用户明确授权时运行远程安装脚本。
- 不要在日志或输出中泄漏数据库密码或 GM 密钥。
- 如需持久化数据，请确认 `./data` 已挂载并可写。
