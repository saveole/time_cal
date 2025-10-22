# 认证架构文档 - Authentication Architecture

## 📋 概述

本文档详细说明了时间管理应用的 GitHub OAuth 认证架构，包括技术实现、安全考虑和最佳实践。

## 🏗️ 架构概览

### 组件架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   GitHub OAuth  │    │   Supabase Auth │    │  Next.js App    │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ OAuth App   │ │◄──►│ │ Auth Provider│ │◄──►│ │ Auth Context│ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ User API    │ │    │ │ JWT Tokens  │ │    │ │ Callback    │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │                 │
                    │ ┌─────────────┐ │
                    │ │ Profiles    │ │
                    │ │ Table       │ │
                    │ └─────────────┘ │
                    └─────────────────┘
```

### 数据流

```
用户操作 → 前端组件 → Auth Context → Supabase Auth → GitHub OAuth
    ↓
GitHub 授权 → 回调处理 → 会话创建 → 用户数据库更新 → 状态同步
```

## 🔧 技术实现

### 1. 前端认证实现

#### AuthContext (`src/contexts/auth-context.tsx`)

```typescript
interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signInWithGitHub: () => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
  updatePassword: (newPassword: string) => Promise<{ error: any }>
}
```

**关键功能**:
- 会话状态管理
- GitHub OAuth 登录
- 自动会话刷新
- 错误处理和重试

#### GitHub OAuth 实现

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

### 2. 回调处理机制

#### 回调页面 (`src/app/auth/callback/page.tsx`)

**职责**:
- 处理 GitHub OAuth 回调
- 验证认证状态
- 处理错误情况
- 重定向到适当页面

**实现逻辑**:
```typescript
useEffect(() => {
  const error = searchParams.get('error')
  if (error) {
    // 处理错误，重定向到登录页
    router.push('/auth/login?error=' + encodeURIComponent(error))
    return
  }

  if (!loading && user) {
    // 认证成功，重定向到目标页面
    const redirectTo = searchParams.get('redirectTo') || '/dashboard'
    router.push(redirectTo)
  }
}, [user, loading, router, searchParams])
```

### 3. 数据库 Schema

#### Profiles 表结构

```sql
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  github_username TEXT,
  github_id INTEGER,
  auth_provider TEXT CHECK (auth_provider IN ('email', 'github')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引优化
CREATE INDEX idx_profiles_github_id ON profiles(github_id);
CREATE INDEX idx_profiles_auth_provider ON profiles(auth_provider);
```

**字段说明**:
- `id`: Supabase Auth 用户 ID
- `github_username`: GitHub 用户名
- `github_id`: GitHub 用户 ID (唯一标识)
- `auth_provider`: 认证提供方式

## 🔒 安全架构

### 1. OAuth 安全流程

#### 安全措施
- **PKCE (Proof Key for Code Exchange)**: 防止授权码拦截攻击
- **State 参数**: 防止 CSRF 攻击
- **HTTPS 强制**: 所有通信加密
- **短期 Access Token**: 减少令牌暴露风险

#### 令牌管理
```typescript
// JWT Token 结构
{
  "aud": "authenticated",
  "exp": 1672531200,
  "sub": "uuid-string",
  "email": "user@example.com",
  "role": "authenticated",
  "app_metadata": {
    "provider": "github",
    "providers": ["github"]
  },
  "user_metadata": {
    "avatar_url": "https://avatars.githubusercontent.com/u/...",
    "full_name": "User Name",
    "user_name": "username"
  }
}
```

### 2. 会话安全

#### 会话存储策略
- **HttpOnly Cookies**: 防止 XSS 攻击
- **SameSite Policy**: 防止 CSRF 攻击
- **Secure Flag**: 仅 HTTPS 传输
- **自动过期**: 令牌自动刷新机制

#### 前端安全
```typescript
// 安全的会话检查
const { data: { session }, error } = await supabase.auth.getSession()
if (error || !session) {
  // 处理无效会话
  await signOut()
}
```

### 3. 数据保护

#### 用户隐私保护
- **最小权限原则**: 仅请求必要的 GitHub 权限
- **数据加密**: 敏感数据加密存储
- **访问控制**: 基于用户身份的数据访问
- **审计日志**: 记录关键认证事件

## 🔄 会话生命周期

### 1. 登录流程

```
用户点击登录 → GitHub 授权 → 获取授权码 → 交换 Access Token → 创建会话
     ↓              ↓              ↓              ↓              ↓
   UI 更新     OAuth 重定向    回调处理      Token 验证      状态同步
```

### 2. 会话维护

```typescript
// 自动会话刷新
supabase.auth.onAuthStateChange((event, session) => {
  switch (event) {
    case 'SIGNED_IN':
      // 更新用户状态
      setUser(session?.user ?? null)
      break
    case 'SIGNED_OUT':
      // 清理用户状态
      setUser(null)
      break
    case 'TOKEN_REFRESHED':
      // 令牌已刷新
      setSession(session)
      break
  }
})
```

### 3. 登出流程

```typescript
const signOut = async () => {
  try {
    await supabase.auth.signOut()
    // 清理本地状态
    setUser(null)
    setSession(null)
  } catch (error) {
    console.error('Sign out error:', error)
  }
}
```

## 🚨 错误处理

### 1. 认证错误类型

#### OAuth 相关错误
- `access_denied`: 用户拒绝授权
- `invalid_client`: 客户端配置错误
- `unauthorized_client`: 未授权的客户端
- `redirect_uri_mismatch`: 回调 URL 不匹配

#### 网络和服务错误
- `network_error`: 网络连接问题
- `timeout`: 请求超时
- `server_error`: 服务器内部错误

### 2. 错误处理策略

```typescript
const handleAuthError = (error: any) => {
  const errorMap = {
    'access_denied': '您取消了授权',
    'invalid_client': '应用配置错误',
    'redirect_uri_mismatch': '回调地址配置错误',
    'network_error': '网络连接失败，请重试',
    'timeout': '请求超时，请重试'
  }

  const message = errorMap[error.code] || '认证失败，请重试'
  setError(message)
}
```

## 📊 性能优化

### 1. 缓存策略

#### 用户数据缓存
```typescript
// React Query 缓存用户数据
const { data: user, isLoading } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUserProfile(userId),
  staleTime: 5 * 60 * 1000, // 5分钟
  cacheTime: 10 * 60 * 1000, // 10分钟
})
```

#### 会话缓存
- 本地存储会话状态
- 减少重复的认证检查
- 智能刷新机制

### 2. 用户体验优化

#### 加载状态
```typescript
// 骨架屏和加载指示器
{loading ? (
  <div className="animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
  </div>
) : (
  <UserProfile user={user} />
)}
```

#### 错误恢复
- 自动重试机制
- 用户友好的错误消息
- 降级处理方案

## 🔮 扩展性考虑

### 1. 多租户支持

#### 组织认证
```typescript
interface OrganizationAuth {
  organizationId: string
  role: 'admin' | 'member' | 'viewer'
  permissions: string[]
}
```

### 2. 多因子认证

#### 2FA 集成
```typescript
const enable2FA = async (userId: string) => {
  // 生成 2FA 密钥
  const secret = await generateTOTPSecret(userId)
  // 显示 QR 码给用户
  return secret
}
```

### 3. 社交登录扩展

#### 其他 OAuth 提供商
- Google OAuth
- Microsoft OAuth
- Discord OAuth

这个架构文档为开发团队提供了完整的认证系统技术参考，有助于理解系统设计、安全考虑和未来扩展方向。