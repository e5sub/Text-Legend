# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN apk add --no-cache tzdata \
  && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime \
  && echo "Asia/Shanghai" > /etc/timezone
ENV TZ=Asia/Shanghai
RUN npm install --production

COPY . .

ENV PORT=3000
EXPOSE 3000

CMD ["node", "src/index.js"]
