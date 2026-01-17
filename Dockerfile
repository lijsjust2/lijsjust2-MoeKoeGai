# 使用标准的 Node.js 镜像（非 alpine，避免依赖问题）
FROM node:20 AS frontend-builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 移除 electron 相关依赖
RUN node -e "const fs = require('fs'); \
             const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8')); \
             if (pkg.devDependencies) { \
               delete pkg.devDependencies.electron; \
               delete pkg.devDependencies['electron-builder']; \
             } \
             if (pkg.dependencies) { \
               delete pkg.dependencies.electron; \
             } \
             fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2)); \
             console.log('Cleaned up package.json');"

# 安装依赖
RUN npm install --legacy-peer-deps

# 复制必要的构建文件
COPY vite.config.js ./
COPY index.html ./
COPY src ./src
COPY public ./public
COPY build ./build
COPY docs ./docs

# 查看目录结构
RUN ls -la
RUN ls -la src
RUN ls -la public

# 构建前端应用
RUN echo "Building frontend..." && npm run build

# Stage 2: 生产环境
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 安装 nginx
RUN apk add --no-cache nginx

# 复制 API 代码
COPY ./api ./api

# 安装 API 依赖
WORKDIR /app/api
RUN npm install --production

# 重置工作目录
WORKDIR /app

# 复制构建的前端文件
COPY --from=frontend-builder /app/dist ./dist

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 8080 6521

# 启动命令
CMD ["sh", "-c", "echo 'Starting MoeKoe Music...'; cd /app/api && node app.js & nginx -g 'daemon off;'"]
