# 认证调试指南

## 问题诊断

GitHub OAuth 认证成功但回调页面无法跳转到 dashboard。

## 已修复的问题

### 1. 中间件路由保护
- **问题**: `/auth/callback` 路径没有被列为公共路由，中间件会拦截
- **修复**: 将 `/auth/callback` 添加到 `publicRoutes` 数组

### 2. 回调页面重定向逻辑
- **问题**: 多次重定向尝试和竞态条件
- **修复**: 添加 `isProcessing` 和 `redirectAttempted` 状态防止重复跳转

### 3. 会话同步延迟
- **问题**: Supabase 会话建立需要时间，回调页面可能过早检查用户状态
- **修复**: 增加超时机制和延迟检查

## 测试步骤

### 1. 清理浏览器存储
```javascript
// 在浏览器控制台执行
localStorage.clear()
sessionStorage.clear()
```

### 2. 重新进行认证流程
1. 访问 `http://localhost:3001/auth/login`
2. 点击 "使用 GitHub 登录"
3. 在 GitHub 授权页面点击 "Authorize"
4. 观察回调页面的调试信息

### 3. 检查调试页面
新的回调页面会显示：
- Loading 状态
- 用户认证状态
- 详细的调试日志
- 手动跳转按钮

## 预期行为

### 成功流程
1. 回调页面加载
2. 显示 "Loading: Yes"
3. 几秒后显示 "User: [email]"
4. 自动跳转到 dashboard

### 失败流程
1. 回调页面加载
2. 显示 "Loading: No"
3. 显示 "User: Not found"
4. 显示错误信息并提供手动跳转选项

## 手动测试选项

如果自动跳转仍然失败，可以使用调试页面上的：
- **手动跳转到 Dashboard** 按钮
- **返回登录页面** 按钮

## 常见问题排查

### 1. 检查控制台日志
```bash
# 查找关键日志
🧪 [SimpleTest] User found: [email]
🧪 [SimpleTest] Executing redirect to /dashboard
```

### 2. 检查网络请求
- 打开浏览器开发者工具
- 查看 Network 标签
- 确认 `/dashboard` 请求是否成功

### 3. 检查中间件日志
```bash
🛡️ [Middleware] Processing request: { pathname: "/dashboard" }
🔐 [Middleware] Session status: { hasSession: true, userId: "..." }
✅ [Middleware] Request allowed to proceed
```

## 恢复原始代码

测试完成后，恢复原始回调页面：
```bash
mv src/app/auth/callback/page.tsx.backup src/app/auth/callback/page.tsx
```