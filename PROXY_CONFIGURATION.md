# HTTP 代理配置指南 - HTTP Proxy Configuration Guide

## 概述 - Overview

本应用支持通过 HTTP 代理访问 GitHub OAuth 服务，适用于企业网络环境或需要通过代理访问外部服务的场景。

This application supports HTTP proxy configuration for accessing GitHub OAuth services, suitable for enterprise network environments or scenarios requiring proxy access to external services.

## 配置方式 - Configuration Methods

### 方法 1: 环境变量配置

在你的 `.env.local` 文件中添加以下配置：

```bash
# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# HTTP Proxy Configuration
HTTP_PROXY=http://your-proxy-server:port
HTTPS_PROXY=http://your-proxy-server:port
NO_PROXY=localhost,127.0.0.1

# JWT Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_jwt_secret_key_here_at_least_32_characters_long
```

### 方法 2: 企业网络配置示例

```bash
# 企业代理服务器示例
HTTP_PROXY=http://proxy.company.com:8080
HTTPS_PROXY=http://proxy.company.com:8080
NO_PROXY=localhost,127.0.0.1,*.company.com

# 或带认证的代理
HTTP_PROXY=http://username:password@proxy.company.com:8080
HTTPS_PROXY=http://username:password@proxy.company.com:8080
```

### 方法 3: 开发环境配置

```bash
# 本地开发代理 (如果需要)
HTTP_PROXY=http://localhost:3128
HTTPS_PROXY=http://localhost:3128
NO_PROXY=localhost,127.0.0.1
```

## 代理支持范围 - Proxy Support Scope

应用会在以下情况下使用代理：

### ✅ 支持的请求
- GitHub OAuth 访问令牌请求
- GitHub 用户信息获取请求
- GitHub 用户邮箱获取请求

### ❌ 不使用代理的请求
- 本地数据库请求
- 本地 API 路由请求
- `localhost` 和 `127.0.0.1` 的请求

## 技术实现 - Technical Implementation

### 代理配置类

```typescript
// src/lib/proxy-config.ts
export function getProxyConfig(): ProxyConfig {
  return {
    http: process.env.HTTP_PROXY,
    https: process.env.HTTPS_PROXY,
    noProxy: process.env.NO_PROXY
  }
}
```

### 自动代理检测

应用会自动检测：
- 环境变量中的代理配置
- 需要代理的 URL 模式
- NO_PROXY 排除列表

### 代理增强功能

- **智能路由**: 自动判断哪些请求需要代理
- **错误处理**: 代理失败时的降级处理
- **调试日志**: 代理使用的详细日志记录
- **安全配置**: 支持认证代理

## 常见配置场景 - Common Configuration Scenarios

### 场景 1: 企业网络环境

```bash
# 企业标准配置
HTTP_PROXY=http://proxy.enterprise.com:8080
HTTPS_PROXY=http://proxy.enterprise.com:8080
NO_PROXY=localhost,127.0.0.1,*.enterprise.com
```

### 场景 2: 需要认证的代理

```bash
# 带用户名密码的代理
HTTP_PROXY=http://user:pass@proxy.company.com:8080
HTTPS_PROXY=http://user:pass@proxy.company.com:8080
NO_PROXY=localhost,127.0.0.1
```

### 场景 3: SOCKS 代理 (需要额外配置)

```bash
# SOCKS 代理需要转换为 HTTP 代理
# 或使用专门的 SOCKS 代理客户端
HTTP_PROXY=http://socks-proxy.company.com:1080
HTTPS_PROXY=http://socks-proxy.company.com:1080
```

## 故障排除 - Troubleshooting

### 1. 代理连接失败

**错误信息**: `ECONNREFUSED` 或 `timeout`

**解决方案**:
- 检查代理服务器地址和端口
- 确认代理服务器运行状态
- 验证网络连接

### 2. 认证失败

**错误信息**: `407 Proxy Authentication Required`

**解决方案**:
- 检查代理用户名密码
- 确认认证方式支持
- 联系网络管理员

### 3. GitHub API 访问被阻止

**错误信息**: GitHub API 返回 403 或连接错误

**解决方案**:
- 检查代理是否允许 GitHub 域名
- 确认代理配置正确
- 尝试直接访问验证连接

### 4. 环境变量不生效

**问题**: 配置了代理但未生效

**解决方案**:
- 重启开发服务器
- 检查 `.env.local` 文件位置
- 确认环境变量格式正确

## 安全注意事项 - Security Considerations

### 1. 代理凭据安全
- 不要在代码中硬编码代理凭据
- 使用环境变量存储敏感信息
- 定期轮换代理密码

### 2. 网络安全
- 仅使用可信的代理服务器
- 验证代理服务器的 SSL 证书
- 监控代理访问日志

### 3. 访问控制
- 配置适当的 NO_PROXY 规则
- 限制代理可访问的域名
- 定期审查代理配置

## 测试验证 - Testing

### 验证代理配置

```bash
# 1. 检查环境变量
echo $HTTP_PROXY
echo $HTTPS_PROXY

# 2. 测试代理连接
curl -x $HTTP_PROXY https://api.github.com

# 3. 检查应用日志
# 查看 "via proxy if configured" 日志信息
```

### 测试 OAuth 流程

1. 启动应用并配置代理
2. 访问登录页面
3. 点击 GitHub 登录
4. 检查控制台日志中的代理使用信息
5. 确认能够成功完成 OAuth 流程

## 开发工具 - Development Tools

### 代理调试日志

应用会在控制台输出详细的代理使用信息：

```
Requesting GitHub access token via proxy if configured...
GitHub token response: { status: 200, ok: true }
Fetching GitHub user profile via proxy if configured...
GitHub user data retrieved: { id: 12345, login: 'username' }
```

### 环境变量验证

应用启动时会验证代理配置并输出状态信息。

## 更多资源 - Additional Resources

- [GitHub OAuth 文档](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Node.js 代理配置](https://nodejs.org/api/cli.html#proxy_http_proxy_and_no_proxy-environment-variables)
- [Next.js 环境变量](https://nextjs.org/docs/basic-features/environment-variables)