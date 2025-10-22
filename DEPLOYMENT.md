# 部署指南

本文档提供了时间管理系统的部署方案，包括本地部署、静态网站部署和服务器部署等多种方式。

## 部署方式概览

### 1. 本地文件访问（最简单）
- **适用场景**：个人使用、演示测试
- **优点**：无需任何服务器，直接打开文件即可使用
- **缺点**：某些浏览器可能有安全限制

### 2. 本地HTTP服务器
- **适用场景**：开发测试、小范围使用
- **优点**：完整的HTTP环境，支持所有功能
- **缺点**：需要运行服务器进程

### 3. 静态网站托管
- **适用场景**：公开访问、个人网站
- **优点**：免费、稳定、全球访问
- **缺点**：需要注册托管服务

### 4. 自建服务器部署
- **适用场景**：企业内部、定制化需求
- **优点**：完全控制、可定制
- **缺点**：需要服务器运维

## 详细部署方案

### 方案一：本地文件访问

#### 步骤
1. 下载项目文件到本地
2. 直接用浏览器打开 `index.html` 文件

#### 注意事项
- Chrome浏览器可能因安全策略限制本地文件访问
- 建议使用Firefox或Edge浏览器
- 如果遇到问题，请使用其他部署方案

### 方案二：本地HTTP服务器

#### 使用Python（推荐）
```bash
# 进入项目目录
cd time_cal

# 启动HTTP服务器
python3 -m http.server 8080

# 访问 http://localhost:8080
```

#### 使用Node.js
```bash
# 安装http-server
npm install -g http-server

# 启动服务器
http-server -p 8080

# 访问 http://localhost:8080
```

#### 使用PHP
```bash
# 启动PHP内置服务器
php -S localhost:8080

# 访问 http://localhost:8080
```

### 方案三：静态网站托管

#### GitHub Pages部署

1. **创建GitHub仓库**
   - 创建新仓库 `time-management-system`
   - 上传所有项目文件

2. **启用GitHub Pages**
   - 进入仓库Settings
   - 找到Pages选项
   - 选择Source为"Deploy from a branch"
   - 选择main分支和root文件夹
   - 点击Save

3. **访问网站**
   - 访问 `https://[username].github.io/time-management-system`

#### Netlify部署

1. **注册Netlify账号**
   - 访问 https://netlify.com
   - 使用GitHub账号注册

2. **部署网站**
   - 点击"New site from Git"
   - 选择GitHub仓库
   - 构建设置保持默认（静态文件）
   - 点击"Deploy site"

3. **自定义域名**（可选）
   - 在Site settings中添加自定义域名

#### Vercel部署

1. **注册Vercel账号**
   - 访问 https://vercel.com
   - 使用GitHub账号注册

2. **导入项目**
   - 点击"New Project"
   - 选择GitHub仓库
   - 确认项目配置
   - 点击"Deploy"

#### 其他静态托管服务
- **Firebase Hosting**
- **Surge.sh**
- **GitLab Pages**
- **Cloudflare Pages**

### 方案四：自建服务器部署

#### 使用Nginx

1. **安装Nginx**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

2. **配置Nginx**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/time-management-system;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # 添加缓存头
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

3. **部署文件**
```bash
# 复制文件到服务器目录
sudo cp -r /path/to/time_cal/* /var/www/time-management-system/

# 设置权限
sudo chown -R www-data:www-data /var/www/time-management-system/
```

#### 使用Apache

1. **安装Apache**
```bash
# Ubuntu/Debian
sudo apt install apache2

# CentOS/RHEL
sudo yum install httpd
```

2. **配置虚拟主机**
```apache
<VirtualHost *:80>
    ServerName your-domain.com
    DocumentRoot /var/www/time-management-system

    <Directory /var/www/time-management-system>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

#### Docker部署

1. **创建Dockerfile**
```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

2. **构建和运行**
```bash
# 构建镜像
docker build -t time-management-system .

# 运行容器
docker run -d -p 8080:80 time-management-system
```

## 生产环境优化

### 1. 文件压缩

#### 使用Gzip压缩（Nginx配置）
```nginx
gzip on;
gzip_types text/css application/javascript application/json;
gzip_min_length 1000;
```

#### 启用Brotli压缩（如果支持）
```nginx
brotli on;
brotli_types text/css application/javascript application/json;
```

### 2. 静态资源优化

#### 设置缓存头
```nginx
location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

#### CDN加速
- 使用CloudFlare、AWS CloudFront等CDN服务
- 自动优化静态资源分发

### 3. 安全配置

#### HTTPS配置
```nginx
server {
    listen 443 ssl;
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    # 其他配置...
}
```

#### 安全头设置
```nginx
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
```

## 监控和维护

### 1. 日志监控

#### Nginx访问日志
```bash
# 查看访问日志
sudo tail -f /var/log/nginx/access.log

# 查看错误日志
sudo tail -f /var/log/nginx/error.log
```

### 2. 性能监控

#### 使用Google Analytics
- 在index.html中添加GA跟踪代码
- 监控用户行为和页面性能

#### 使用Uptime监控
- 设置网站可用性监控
- 及时发现和解决问题

### 3. 备份策略

#### 数据备份提醒
- 提醒用户定期导出数据
- 在应用中添加备份提示

#### 服务器备份
- 定期备份服务器配置
- 备份SSL证书等文件

## 故障排除

### 常见问题

1. **页面无法加载**
   - 检查文件路径是否正确
   - 确认服务器是否正常运行
   - 检查防火墙设置

2. **JavaScript错误**
   - 检查浏览器控制台错误信息
   - 确认所有JS文件都正确加载
   - 检查文件编码格式

3. **CSS样式问题**
   - 确认CSS文件路径正确
   - 检查文件权限设置
   - 清除浏览器缓存

4. **数据无法保存**
   - 检查浏览器是否支持localStorage
   - 确认没有使用隐私模式
   - 检查浏览器存储空间限制

### 调试方法

1. **浏览器开发者工具**
   - F12打开开发者工具
   - 查看Console和Network标签
   - 检查资源加载情况

2. **网络请求检查**
   - 使用Network标签检查HTTP请求
   - 确认所有资源都正确加载
   - 检查响应状态码

3. **移动端测试**
   - 使用浏览器移动端模拟器
   - 在真实移动设备上测试
   - 检查响应式布局

---

根据您的具体需求选择合适的部署方案。如有任何问题，请参考技术文档或联系支持团队。