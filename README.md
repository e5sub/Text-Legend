# 文字传奇 1.76（网页版文字版）

## Docker 启动

```
docker build -t text-legend .
docker run -p 3000:3000 -e DB_CLIENT=sqlite -e DB_FILENAME=/app/data/game.sqlite -e ADMIN_BOOTSTRAP_SECRET=change_me -v %cd%/data:/app/data text-legend
```

或使用 docker-compose：

```
docker compose up --build
```

MySQL compose：

```
docker compose -f docker-compose.mysql.yml up --build
```

## 说明
- 这是一个致敬 1.76 时代的网页文字版游戏。
- 功能界面：聊天面板、交易面板、商店弹窗（购买/出售）、修炼面板、在线人数、沙巴克加成提示。
- 行会：创建行会需要 `woma_horn`（沃玛号角），沙巴克报名需要会长操作。
- 指令：`help`、`look`、`go <方向>`、`attack <怪物/玩家>`、`pk <玩家>`、`cast <技能> <怪物>`、`autoskill <技能/off>`、`autopotion <hp%> <mp%>`、`stats`、`bag`、`buy`、`sell <物品> [数量]`、`train <属性>`、`quests`、`party`、`guild`、`gsay`、`sabak`、`vip activate <code>`、`trade`、`mail`、`teleport <区域:房间>`。

## GM 后台

打开 `http://localhost:3000/admin/` 进入后台。

首次配置 GM（两种方式任选其一）：
1) 注册一个普通账号
2) 在容器环境变量中设置 `ADMIN_BOOTSTRAP_SECRET` 与 `ADMIN_BOOTSTRAP_USER`
3) 启动服务后自动设为 GM

或调用 `/admin/bootstrap` 传入 `secret` 和 `username`

之后可在后台中提升/取消 GM、修改角色、发送站内邮件、生成 VIP 激活码。
