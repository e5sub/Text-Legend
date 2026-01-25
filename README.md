# 文字传奇 1.76（网页版文字版）

## 快速启动

本项目同时支持 SQLite 和 MySQL。

SQLite：
```
docker build -t text-legend .
docker run -p 3000:3000 -e DB_CLIENT=sqlite -e DB_FILENAME=/app/data/game.sqlite -e DB_POOL_MAX=1 -e SQLITE_WAL=true -e SQLITE_SYNCHRONOUS=NORMAL -e ADMIN_BOOTSTRAP_SECRET=change_me -e ADMIN_BOOTSTRAP_USER=admin_account -v %cd%/data:/app/data text-legend
```

或使用 docker-compose：
```
docker compose up --build
```

MySQL（compose）：
```
docker compose -f docker-compose.mysql.yml up --build
```

## 配置说明

数据库：
- `DB_CLIENT`：`sqlite` 或 `mysql`
- `DB_FILENAME`：SQLite 文件路径
- `DB_HOST`/`DB_USER`/`DB_PASSWORD`/`DB_NAME`：MySQL 连接信息
- `DB_POOL_MAX`：连接池最大连接数（SQLite 建议 1）

SQLite 优化（仅 SQLite 生效）：
- `SQLITE_WAL`：是否启用 WAL（默认 true）
- `SQLITE_SYNCHRONOUS`：同步模式（默认 NORMAL，可设 FULL/EXTRA）

管理员：
- `ADMIN_BOOTSTRAP_SECRET`：初始化 GM 密钥
- `ADMIN_BOOTSTRAP_USER`：需要提升为 GM 的账号

## 说明
- 这是一个致敬 1.76 时代的网页文字版游戏。
- 功能界面：聊天面板、交易面板、商店弹窗（购买/出售）、修炼面板、在线人数、沙巴克加成提示。
- 行会：创建行会需要 `woma_horn`（沃玛号角），沙巴克报名需要会长操作。
- 指令：`help`、`look`、`go <方向>`、`attack <怪物/玩家>`、`pk <玩家>`、`cast <技能> <怪物>`、`autoskill <技能/off>`、`autopotion <hp%> <mp%>`、`stats`、`bag`、`buy`、`sell <物品> [数量]`、`train <属性>`、`quests`、`party`、`guild`、`gsay`、`sabak`、`vip activate <code>`、`trade`、`mail`、`teleport <区域:房间>`。

## GM 后台

打开 `http://localhost:3000/admin/` 进入后台。

首次配置 GM（任选其一）：
1) 注册一个普通账号
2) 在容器环境变量中设置 `ADMIN_BOOTSTRAP_SECRET` 与 `ADMIN_BOOTSTRAP_USER`
3) 启动服务后自动设为 GM

或调用 `/admin/bootstrap` 传入 `secret` 和 `username`。

后台支持：
- 用户/权限管理
- 角色修改
- 站内邮件
- VIP 激活码与自助激活开关
- 掉落日志开关
- 数据备份与导入

## 数据备份与导入

后台支持下载备份与导入 JSON 数据，SQLite 与 MySQL 可互相导入。

注意：导入会覆盖当前全部数据，建议停服或确保无在线玩家。

## 后台 API（节选）

所有接口都需要 `Authorization: Bearer <admin-token>`。

掉落日志开关：
```
GET  /admin/loot-log-status
POST /admin/loot-log-toggle   body: { "enabled": true|false }
```

备份与导入：
```
GET  /admin/backup
POST /admin/import            body: 备份 JSON
```
