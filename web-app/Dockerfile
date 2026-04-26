# 前端多阶段构建：node 构建 → nginx 托管
# 原则：产物镜像只含静态文件，不含 node_modules

# ============ 阶段 1: 构建 ============
FROM node:24-alpine AS builder

WORKDIR /app

# 构建参数（由 compose build.args 传入）
ARG VITE_API_BASE_URL=http://localhost/api/v1
ARG VITE_ENABLE_SSE=true
ARG VITE_RECONNECT_DELAY=3000

# 先拷 package 做依赖层缓存
COPY package*.json ./

# 用 npm ci（严格按 lockfile），没有 lockfile 则回退 npm install
RUN npm ci --prefer-offline --no-audit --no-fund \
    || npm install --no-audit --no-fund

COPY . .

# 将构建参数写入 .env.production（Vite 编译期读取）
RUN printf "VITE_API_BASE_URL=%s\nVITE_ENABLE_SSE=%s\nVITE_RECONNECT_DELAY=%s\n" \
        "$VITE_API_BASE_URL" "$VITE_ENABLE_SSE" "$VITE_RECONNECT_DELAY" \
        > .env.production \
    && cat .env.production

RUN npm run build

# ============ 阶段 2: 静态托管 ============
FROM nginx:1.27-alpine AS runtime

# 清理默认站点
RUN rm -rf /usr/share/nginx/html/*

COPY --from=builder /app/dist /usr/share/nginx/html

# 内部容器级 nginx 配置：仅负责 SPA 路由回退和静态缓存
# 对外流量由外层 Nginx（主 compose nginx 服务）反代到此容器
RUN cat > /etc/nginx/conf.d/default.conf <<'EOF'
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # 静态资源长缓存
    location ~* \.(js|css|woff2?|ttf|eot|png|jpg|jpeg|gif|svg|webp|ico)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # SPA 路由：未命中文件 → index.html
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache";
    }

    # 不缓存入口页
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # 健康检查
    location /healthz {
        access_log off;
        return 200 'ok';
        add_header Content-Type text/plain;
    }
}
EOF

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
    CMD wget -qO- http://localhost/healthz || exit 1
