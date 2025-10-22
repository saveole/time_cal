# GitHub OAuth Setup Guide

This guide explains how to configure GitHub OAuth authentication for the Time Management application.

## Overview

The application now uses GitHub OAuth for user authentication. Users can sign in with their GitHub account, and new user profiles are automatically created from their GitHub profile information.

## 🔐 Authentication Flow

### Complete OAuth Flow Diagram

```
用户点击 "使用 GitHub 登录"
↓
应用调用 signInWithGitHub()
↓
重定向到 GitHub OAuth 授权页面
  https://github.com/login/oauth/authorize?client_id=...
↓
用户在 GitHub 上授权应用
↓
GitHub 重定向到 Supabase 回调地址
  https://your-project.supabase.co/auth/v1/callback?code=...
↓
Supabase 交换 code 获取 access_token
↓
Supabase 创建用户会话
↓
重定向到应用回调页面
  http://localhost:3001/auth/callback
↓
检查用户认证状态
↓
成功: 重定向到 dashboard
失败: 重定向到 login 页面并显示错误
```

### 详细步骤说明

#### 1. 发起认证请求
- 用户点击登录按钮
- 应用调用 `supabase.auth.signInWithOAuth({ provider: 'github' })`
- 设置回调 URL 为 `/auth/callback`

#### 2. GitHub 授权
- 用户被重定向到 GitHub 授权页面
- GitHub 显示应用权限请求
- 用户确认授权

#### 3. 处理回调
- GitHub 重定向回 Supabase
- Supabase 处理授权码并创建会话
- Supabase 重定向到应用的 `/auth/callback` 页面

#### 4. 完成认证
- `/auth/callback` 页面检查用户认证状态
- 如果认证成功，重定向到 `/dashboard`
- 如果认证失败，重定向到 `/auth/login` 并显示错误

## 🔧 技术实现细节

### 关键文件和功能

#### 1. 认证上下文 (`src/contexts/auth-context.tsx`)
```typescript
const signInWithGitHub = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  return { error }
}
```

#### 2. 回调处理页面 (`src/app/auth/callback/page.tsx`)
- 处理 GitHub OAuth 回调
- 检查 URL 中的错误参数
- 验证用户认证状态
- 重定向到适当页面

#### 3. 登录页面 (`src/app/auth/login/page.tsx`)
- 显示 GitHub 登录按钮
- 处理 URL 错误参数
- 提供用户友好的错误信息

### 状态管理

#### 认证状态
- `user`: 当前用户信息
- `session`: 用户会话信息
- `loading`: 认证状态加载中

#### 错误处理
- OAuth 授权错误
- 网络连接错误
- 用户取消授权
- 回调处理错误

## 🚨 常见问题和解决方案

### 问题 1: "Unsupported provider: provider is not enabled"
**原因**: GitHub OAuth 提供商未在 Supabase 中启用
**解决**:
1. 登录 Supabase Dashboard
2. 进入 Authentication → Providers
3. 启用 GitHub 提供商
4. 填入正确的 Client ID 和 Client Secret

### 问题 2: 重定向循环（登录后回到登录页面）
**原因**: OAuth 回调处理不正确
**解决**:
1. 确保 `/auth/callback` 页面存在
2. 检查 Supabase URL 配置中的回调地址
3. 验证站点 URL 和重定向 URL 配置

### 问题 3: GitHub OAuth App 配置错误
**原因**: 回调 URL 不匹配
**解决**:
1. 在 GitHub OAuth App 中设置正确的回调 URL
2. 确保格式为: `https://your-project.supabase.co/auth/v1/callback`
3. 重新生成 Client ID 和 Secret

### 问题 4: CORS 错误
**原因**: 域名配置问题
**解决**:
1. 在 Supabase 中添加正确的站点 URL
2. 确保开发环境 URL 包含在重定向 URL 中

### 问题 5: 用户数据同步失败
**原因**: 数据库 schema 问题
**解决**:
1. 运行数据库迁移脚本
2. 检查 profiles 表结构
3. 验证 GitHub 相关字段是否存在

## 🛠️ 开发环境配置

### 本地开发设置

1. **GitHub OAuth App**
   - Homepage URL: `http://localhost:3001`
   - Callback URL: `https://your-project.supabase.co/auth/v1/callback`

2. **Supabase 配置**
   - Site URL: `http://localhost:3001`
   - Redirect URLs: `http://localhost:3001/**`

3. **环境变量**
   ```env
   # GitHub OAuth (配置在 Supabase Dashboard 中)
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   ```

### 生产环境配置

1. **GitHub OAuth App**
   - Homepage URL: `https://your-production-domain.com`
   - Callback URL: `https://your-project.supabase.co/auth/v1/callback`

2. **Supabase 配置**
   - Site URL: `https://your-production-domain.com`
   - Redirect URLs: `https://your-production-domain.com/**`

## 📊 监控和调试

### 日志检查位置

1. **浏览器控制台**
   - 检查 JavaScript 错误
   - 查看网络请求详情

2. **Supabase Dashboard**
   - Authentication → Logs
   - 查看认证尝试和失败记录

3. **GitHub OAuth App**
   - 查看授权请求历史
   - 检查回调 URL 匹配

### 调试工具

1. **浏览器开发者工具**
   - Network 标签查看 HTTP 请求
   - Application 标签查看本地存储

2. **OAuth Playground**
   - 测试 OAuth 流程
   - 验证配置参数

## 🔒 安全考虑

### 安全最佳实践

1. **Client Secret 管理**
   - 不在客户端代码中暴露
   - 使用环境变量管理
   - 定期轮换密钥

2. **回调 URL 验证**
   - 使用 HTTPS
   - 验证重定向域名
   - 防止开放重定向

3. **会话管理**
   - 使用安全的会话存储
   - 实现适当的超时机制
   - 提供登出功能

4. **用户数据保护**
   - 最小化权限请求
   - 定期审核数据访问
   - 遵循数据保护法规

## 📈 性能优化

### 优化建议

1. **缓存策略**
   - 缓存用户基本信息
   - 减少重复的 API 调用

2. **加载状态**
   - 提供加载指示器
   - 改善用户体验

3. **错误恢复**
   - 实现重试机制
   - 提供友好的错误消息

这个详细的认证流程文档涵盖了从配置到调试的完整过程，帮助开发者和用户理解和使用 GitHub OAuth 认证系统。

## Prerequisites

- A GitHub account
- Administrator access to your Supabase project
- Access to the application's source code

## Step 1: Create GitHub OAuth App

1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: Time Management App
   - **Homepage URL**: `https://your-domain.com` (or `http://localhost:3000` for development)
   - **Authorization callback URL**: `https://your-project-id.supabase.co/auth/v1/callback` (replace `your-project-id` with your actual Supabase project ID)
4. Click "Register application"
5. Copy the **Client ID** and generate a **Client Secret**

## Step 2: Configure Supabase

1. Go to your Supabase project dashboard
2. Navigate to Authentication → Providers
3. Find GitHub in the list and enable it
4. Enter your GitHub **Client ID** and **Client Secret**
5. Set the redirect URL to match your GitHub OAuth app callback
6. Save the configuration

## Step 3: Update Environment Variables

Add the following to your `.env.local` file (these are for reference; the actual values are configured in Supabase):

```env
# GitHub OAuth Configuration (configured in Supabase dashboard)
# These values are managed in Supabase, not in environment variables
```

Note: With Supabase Auth, the GitHub OAuth credentials are stored directly in the Supabase dashboard rather than in environment variables.

## Step 4: Database Migration

Run the provided migration to add GitHub-specific fields to the profiles table:

```sql
-- This migration is included in migrations/001_add_github_auth.sql
-- It adds: github_username, github_id, and auth_provider fields
```

You can run this migration through the Supabase SQL Editor or your preferred migration tool.

## Step 5: Test the Implementation

1. Start the development server: `npm run dev`
2. Navigate to `/auth/login`
3. Click "使用 GitHub 登录" (Sign in with GitHub)
4. You should be redirected to GitHub for authentication
5. After authorizing, you'll be redirected back to the application as an authenticated user

## What Changes Were Made

### Authentication Flow
- **Before**: Email/password registration and login
- **After**: GitHub OAuth authentication only

### Database Schema
- Added `github_username` field to profiles table
- Added `github_id` field for GitHub user identification
- Added `auth_provider` field to track authentication method

### UI Changes
- Login page now shows GitHub login button
- Registration page has been removed
- Header no longer shows registration link
- Improved error handling for OAuth failures

### Code Changes
- Updated `AuthContext` to include `signInWithGitHub` function
- Removed `signUp` function from authentication context
- Updated middleware to remove registration route handling
- Enhanced TypeScript types for GitHub authentication

## Migration for Existing Users

Existing users who registered with email/password will:
- Keep their existing profiles and data
- Have `auth_provider` set to 'email' in the database
- Can continue using the application with their existing accounts
- New users must authenticate via GitHub

## Security Considerations

- GitHub OAuth provides secure authentication without handling passwords
- User sessions are managed by Supabase Auth
- GitHub user data is automatically synchronized on each login
- No password storage or management required

## Troubleshooting

### Common Issues

1. **"Redirect URI mismatch" error**
   - Ensure the callback URL in GitHub OAuth app matches your Supabase project URL exactly
   - Check that the redirect URL includes the full path: `/auth/v1/callback`

2. **"Application not found" error**
   - Verify GitHub OAuth app is properly configured
   - Check that Client ID and Client Secret are correctly entered in Supabase

3. **User creation fails**
   - Check that the database migration has been applied
   - Verify the database connection and permissions

### Debug Mode

To enable additional logging for troubleshooting, you can temporarily add console.log statements to the `signInWithGitHub` function in `src/contexts/auth-context.tsx`.

## Support

If you encounter issues during setup:

1. Check the Supabase Auth logs for detailed error messages
2. Verify all GitHub OAuth app settings
3. Ensure the database migration has been applied successfully
4. Review the browser console for any client-side errors