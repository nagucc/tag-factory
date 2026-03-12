# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package.json package-lock.json ./
RUN npm ci --only=production=false

# 复制源代码
COPY . .

# 构建应用
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# 生产阶段
FROM node:20-alpine AS runner

WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# 创建非root用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 切换到非root用户
USER nextjs

# 暴露端口
EXPOSE 8080

# 启动应用
CMD ["node", "server.js"]
