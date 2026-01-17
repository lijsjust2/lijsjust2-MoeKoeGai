# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++ \
    curl \
    && rm -rf /var/cache/apk/*

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 清理 electron 相关依赖（减少构建时间）
RUN node -e "const fs = require('fs'); const path = require('path'); \
             const pkgPath = path.join(__dirname, 'package.json'); \
             const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')); \
             if (pkg.devDependencies) { \
               delete pkg.devDependencies.electron; \
               delete pkg.devDependencies['electron-builder']; \
             } \
             if (pkg.dependencies) { \
               delete pkg.dependencies.electron; \
             } \
             fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2)); \
             console.log('清理后的 package.json:', JSON.stringify(pkg, null, 2));"

# 安装依赖（增加详细日志）
RUN npm install --verbose

# 复制所有源代码
COPY . .

# 查看当前目录结构（调试用）
RUN ls -la

# 构建前端应用（增加详细日志）
RUN npm run build --verbose

# Stage 2: Setup Combined App
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apk add --no-cache \
    nginx \
    && rm -rf /var/cache/apk/*

# 复制 API 代码
COPY ./api ./api

# 安装 API 依赖
WORKDIR /app/api
RUN npm install --production --verbose

# 重置工作目录
WORKDIR /app

# 从构建阶段复制前端静态文件
COPY --from=frontend-builder /app/dist ./dist

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 8080 6521

# 启动命令
CMD ["sh", "-c", "echo 'Starting MoeKoe Music...'; echo 'Client will be available at http://localhost:8080/'; cd /app/api && node app.js & nginx -g 'daemon off;'"]
