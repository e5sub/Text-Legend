# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN apk add --no-cache --virtual .build-deps python3 make g++ \
  && apk add --no-cache tzdata \
  && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
  && echo "Asia/Shanghai" > /etc/timezone
ENV TZ=Asia/Shanghai
RUN npm install --omit=dev --no-audit --no-fund \
  && apk del .build-deps

COPY . .

ENV PORT=3000
EXPOSE 3000

CMD ["node", "src/index.js"]
