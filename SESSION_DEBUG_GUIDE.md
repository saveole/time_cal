# 会话持久化问题调试指南

## 问题描述

用户登录成功后，导航到受保护页面（如"统计分析"）时被重定向回登录页面，表明会话状态在页面导航时丢失。

## 已实施的修复

### 1. AuthContext 会话管理改进

#### 问题诊断
- 原始代码在会话检查后没有正确验证会话有效性
- `loading` 状态设置为 `false` 但用户状态可能仍为 `null`

#### 修复内容
```typescript
// 改进的会话检查逻辑
if (session && session.user) {
  setSession(session)
  setUser(session.user)
  console.log('👤 [Auth] User state set from session')
} else {
  console.log('🚫 [Auth] No valid session found, clearing user state')
  setSession(null)
  setUser(null)
}

// 改进的 auth state change 处理
switch (event) {
  case 'SIGNED_IN':
    if (session && session.user) {
      setSession(session)
      setUser(session.user)
    }
    break
  // ... 其他事件处理
}
```

### 2. 中间件会话验证增强

#### 问题诊断
- 中间件只检查 `session` 存在，没有验证会话有效性
- 可能接受无效或过期的会话

#### 修复内容
```typescript
// 增强的会话验证
const isValidSession = session && session.user && session.access_token

if (!isValidSession && protectedRoutes.some(route => pathname.startsWith(route))) {
  // 重定向到登录页面
}
```

### 3. 调试工具创建

#### SessionDebugger 组件
- 左下角显示实时会话状态
- 对比 AuthContext 和直接 Supabase 会话
- 提供手动操作（刷新会话、获取用户、登出）

## 调试步骤

### 1. 检查会话状态调试器

在页面左下角查看 "🔍 会话状态调试器"：

**正常状态应该显示：**
- AuthContext Loading: No
- AuthContext User: [用户邮箱]
- AuthContext Session: Valid
- Direct session: Found

**异常状态可能显示：**
- AuthContext User: None
- AuthContext Session: None
- Direct session: None

### 2. 执行手动操作

如果状态异常，尝试以下操作：

1. **点击 "Get User" 按钮**
   ```javascript
   // 预期输出: Get user failed: ... 或 Current user: [邮箱]
   ```

2. **点击 "Refresh" 按钮**
   ```javascript
   // 预期输出: Refresh successful: session refreshed
   ```

3. **检查控制台日志**
   ```bash
   # 查找关键日志
   🔍 [SessionDebug] AuthContext loading: false
   🔍 [SessionDebug] AuthContext user: null
   🔍 [AuthDebug] No valid session found, clearing user state
   ```

### 3. 测试导航流程

1. **登录测试**
   ```
   访问 /auth/login → GitHub 登录 → 成功后应到 /dashboard
   ```

2. **导航测试**
   ```
   从 /dashboard 点击 "统计分析" → 应正常跳转到 /statistics
   ```

3. **会话持久化测试**
   ```
   刷新页面 → 应保持登录状态
   关闭标签页重新打开 → 应保持登录状态
   ```

### 4. 中间件日志分析

查看中间件日志输出：

**成功日志：**
```bash
🔐 [Middleware] Session status: {
  hasSession: true,
  userId: "415c833a-4e13-4fc6-ac2f-60912e5a64f5",
  sessionValid: true,
  pathname: "/statistics"
}
✅ [Middleware] Request allowed to proceed
```

**失败日志：**
```bash
🔐 [Middleware] Session status: {
  hasSession: false,
  sessionValid: false,
  pathname: "/statistics"
}
🚫 [Middleware] Unauthenticated user accessing protected route
🔙 [Middleware] Redirecting to login with redirectTo parameter
```

## 常见问题及解决方案

### 问题 1: 会话在页面刷新后丢失

**症状**: 登录成功，刷新页面后需要重新登录
**原因**: 本地存储问题或令牌过期
**解决方案**:
- 检查浏览器 localStorage 中的 `supabase.auth.token`
- 使用 SessionDebugger 的 "Refresh" 按钮

### 问题 2: AuthContext 和中间件状态不一致

**症状**: SessionDebugger 显示 AuthContext 有用户，但中间件检测无会话
**原因**: 服务端和客户端会话不同步
**解决方案**:
- 重启开发服务器
- 清除浏览器缓存和存储
- 检查 Supabase 配置

### 问题 3: 令牌过期

**症状**: 登录成功后一段时间后需要重新登录
**原因**: JWT 令牌过期（通常1小时）
**解决方案**:
- Supabase 应该自动刷新令牌
- 检查 `TOKEN_REFRESHED` 事件是否触发

## 手动修复步骤

如果自动修复无效，可尝试：

1. **完全清除浏览器数据**
   ```javascript
   // 在浏览器控制台执行
   localStorage.clear()
   sessionStorage.clear()
   location.reload()
   ```

2. **重新登录**
   - 访问 `/auth/login`
   - 完成 GitHub OAuth 流程
   - 观察调试工具状态

3. **检查 Supabase 配置**
   - 确认 GitHub OAuth 应用配置正确
   - 验证 Supabase 站点 URL 设置

## 预期结果

修复后，用户体验应该是：

1. ✅ 登录成功后自动跳转到 dashboard
2. ✅ 可以自由导航到所有受保护页面
3. ✅ 页面刷新后保持登录状态
4. ✅ 关闭标签页重新打开仍保持登录
5. ✅ 令牌自动刷新，无需重新登录

## 监控要点

使用调试工具监控以下指标：

- **会话同步**: AuthContext 和直接会话应该一致
- **令牌有效性**: access_token 应该存在且有效
- **自动刷新**: TOKEN_REFRESHED 事件应该定期触发
- **路由保护**: 中间件应该正确识别认证状态