# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json* ./
RUN apt-get update \
  && apt-get install -y --no-install-recommends tzdata \
  && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
  && echo "Asia/Shanghai" > /etc/timezone
ENV TZ=Asia/Shanghai
RUN npm install --omit=dev --no-audit --no-fund \
  && apt-get purge -y --auto-remove \
  && rm -rf /var/lib/apt/lists/*

COPY . .

ENV PORT=3000
EXPOSE 3000

CMD ["node", "src/index.js"]
