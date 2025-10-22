# 认证故障排除指南 - Authentication Troubleshooting Guide

## 🚨 快速诊断

### 常见错误及解决方案

#### 1. "Unsupported provider: provider is not enabled"
**症状**: 点击 GitHub 登录后看到此错误
**原因**: GitHub OAuth 提供商未在 Supabase 中正确配置

**解决步骤**:
```bash
# 1. 检查 Supabase 配置
访问: https://your-project.supabase.co
进入: Authentication → Providers → GitHub
确保: 提供商已启用，Client ID 和 Secret 正确填写

# 2. 验证 GitHub OAuth App
访问: https://github.com/settings/applications
检查: 回调 URL 格式为 https://your-project.supabase.co/auth/v1/callback

# 3. 测试 OAuth URL
直接访问: https://github.com/login/oauth/authorize?client_id=YOUR_CLIENT_ID
应该显示 GitHub 授权页面
```

#### 2. 重定向循环（登录后回到登录页面）
**症状**: 成功授权 GitHub 后又回到登录页面
**原因**: OAuth 回调处理有问题

**解决步骤**:
```bash
# 1. 检查回调页面
确认文件存在: src/app/auth/callback/page.tsx

# 2. 检查 Supabase URL 配置
进入: Authentication → URL Configuration
设置: Site URL = http://localhost:3001
设置: Redirect URLs = http://localhost:3001/**

# 3. 检查浏览器控制台
查看网络请求，确认认证流程是否正确
```

#### 3. "redirect_uri_mismatch" 错误
**症状**: GitHub 显示回调地址不匹配
**原因**: GitHub OAuth App 和 Supabase 配置不一致

**解决步骤**:
```bash
# 1. 统一回调地址
GitHub OAuth App: https://your-project.supabase.co/auth/v1/callback
Supabase 配置: 自动处理，无需手动设置

# 2. 检查协议
确保使用 HTTPS (生产环境) 或正确设置本地环境

# 3. 重新生成 Client ID/Secret
如果配置有误，重新创建 GitHub OAuth App
```

## 🔍 调试工具和方法

### 1. 浏览器开发者工具

#### Network 标签检查
```javascript
// 查看认证请求
1. 点击 GitHub 登录
2. 查看 Network 标签
3. 寻找 /auth/v1/authorize 请求
4. 检查响应状态和重定向
```

#### Application 标签检查
```javascript
// 检查本地存储
1. Application → Local Storage
2. 查看是否有 supabase.auth.token 相关数据
3. 检查会话信息是否正确存储
```

#### Console 错误日志
```javascript
// 常见错误信息
- "CORS policy error"
- "Network error"
- "Invalid JWT token"
- "Session expired"
```

### 2. Supabase Dashboard 调试

#### 认证日志检查
```
位置: Authentication → Logs
查找:
- 登录尝试记录
- 错误详情
- 用户会话创建记录
```

#### 用户管理检查
```
位置: Authentication → Users
确认:
- 用户是否成功创建
- 用户信息是否正确
- 认证提供方是否为 github
```

### 3. GitHub OAuth App 调试

#### OAuth 应用设置
```
位置: https://github.com/settings/applications
检查:
- Client ID 是否正确
- 回调 URL 是否匹配
- 应用状态是否为 Active
```

## 🛠️ 环境特定问题

### 开发环境问题

#### 本地开发配置
```bash
# .env.local 配置示例
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# GitHub OAuth App 配置
Homepage URL: http://localhost:3001
Callback URL: https://your-project.supabase.co/auth/v1/callback

# Supabase URL 配置
Site URL: http://localhost:3001
Redirect URLs: http://localhost:3001/**
```

#### 端口冲突解决
```bash
# 如果端口 3001 被占用
npm run dev -- -p 3002

# 然后更新所有配置中的端口号
- GitHub OAuth App Homepage URL
- Supabase Site URL
- 环境变量中的回调地址
```

### 生产环境问题

#### HTTPS 配置
```bash
# 确保 HTTPS 正确配置
1. SSL 证书有效
2. 强制 HTTPS 重定向
3. 安全头配置

# 更新 GitHub OAuth App
Homepage URL: https://your-domain.com
Callback URL: https://your-project.supabase.co/auth/v1/callback

# 更新 Supabase 配置
Site URL: https://your-domain.com
Redirect URLs: https://your-domain.com/**
```

#### 域名配置问题
```bash
# 检查 DNS 配置
dig your-domain.com
nslookup your-domain.com

# 检查 SSL 证书
openssl s_client -connect your-domain.com:443
```

## 📋 检查清单

### 预部署检查
```markdown
- [ ] GitHub OAuth App 已创建并配置正确
- [ ] Supabase GitHub 提供商已启用
- [ ] 回调 URL 在 GitHub 和 Supabase 中一致
- [ ] 环境变量正确配置
- [ ] 数据库迁移已运行
- [ ] 本地测试通过
```

### 生产部署检查
```markdown
- [ ] 使用 HTTPS 协议
- [ ] 域名 DNS 正确解析
- [ ] SSL 证书有效
- [ ] 生产环境 GitHub OAuth App 配置
- [ ] Supabase 生产配置
- [ ] 错误监控设置
```

## 🆘 获取帮助

### 调试信息收集
```bash
# 创建调试报告
1. 浏览器控制台截图
2. Network 请求日志
3. Supabase 认证日志
4. GitHub OAuth App 配置截图
5. 环境配置信息 (隐藏敏感数据)
```

### 支持资源
- [Supabase Auth 文档](https://supabase.com/docs/guides/auth)
- [GitHub OAuth 文档](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [Next.js Auth 最佳实践](https://nextjs.org/docs/authentication)

## 🔄 常见修复命令

### 重置开发环境
```bash
# 清理并重启
rm -rf .next
npm install
npm run dev

# 清理浏览器存储
# 开发者工具 → Application → Storage → Clear
```

### 重新配置 OAuth
```bash
# 1. 删除现有 GitHub OAuth App
# 2. 重新创建 GitHub OAuth App
# 3. 更新 Supabase 配置
# 4. 重启开发服务器
# 5. 测试完整流程
```

### 数据库问题修复
```sql
-- 检查用户表结构
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles';

-- 检查 GitHub 用户数据
SELECT id, email, github_username, github_id, auth_provider
FROM profiles
WHERE auth_provider = 'github';
```

这个故障排除指南为开发者提供了快速定位和解决认证问题的方法，包含具体的检查步骤和修复命令。