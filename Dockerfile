# GitHub Actions 专用 Dockerfile
# 使用标准 Node.js 镜像进行构建
FROM node:20-bullseye AS build

# 设置工作目录
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 清理 electron 依赖
RUN node -e "const fs = require('fs'); \
             let pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8')); \
             if (pkg.devDependencies) { \
               delete pkg.devDependencies.electron; \
               delete pkg.devDependencies['electron-builder']; \
             } \
             if (pkg.dependencies) { \
               delete pkg.dependencies.electron; \
             } \
             fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2)); \
             console.log('Cleaned electron dependencies');"

# 安装依赖
RUN npm install --legacy-peer-deps --no-audit --no-fund

# 复制项目文件
COPY . .

# 构建前端
RUN npm run build

# 生产环境镜像
FROM node:20-alpine

# 设置工作目录
WORKDIR /app

# 安装 nginx
RUN apk add --no-cache nginx

# 复制构建产物
COPY --from=build /app/dist /app/dist

# 复制 API 代码
COPY api /app/api

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

# 安装 API 依赖
WORKDIR /app/api
RUN npm install --production --no-audit --no-fund

# 暴露端口
EXPOSE 8080 6521

# 启动服务
CMD ["sh", "-c", "cd /app/api && node app.js & nginx -g 'daemon off;'"]
