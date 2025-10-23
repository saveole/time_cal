# 时间管理系统 - Time Management System

一个功能完整的时间管理应用，帮助用户记录日常作息、追踪活动时间，并提供详细的时间使用统计分析。

A comprehensive time management application that helps users track daily schedules, log activities, and gain insights into their time usage patterns.

## 功能特性 - Features

### 🛏️ 睡眠记录 - Sleep Tracking
- 记录每日起床和睡觉时间
- 睡眠时长自动计算
- 睡眠模式分析
- 周睡眠历史查看

### 📝 活动记录 - Activity Logging
- 工作和休闲活动时间记录
- 活动分类管理
- 每日时间分配追踪
- 目标设定和进度监控

### 📊 统计分析 - Statistics & Analytics
- 时间分布图表
- 周趋势分析
- 月度生产力报告
- 活动模式识别

### 📈 数据导出 - Data Export
- CSV格式数据导出
- 周报和月报生成
- 打印友好的报告格式

## 快速开始 - Quick Start

### 安装和运行 - Installation & Running

1. 克隆项目到本地：
   ```bash
   git clone <repository-url>
   cd time_cal
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 配置环境变量：
   ```bash
   cp .env.example .env.local
   # 编辑 .env.local 添加认证和数据库配置
   ```

4. （可选）配置 HTTP 代理（适用于企业网络环境）：
   ```bash
   # 在 .env.local 中添加代理配置
   HTTP_PROXY=http://your-proxy-server:port
   HTTPS_PROXY=http://your-proxy-server:port
   NO_PROXY=localhost,127.0.0.1
   ```
   详细说明请参考 [PROXY_CONFIGURATION.md](./PROXY_CONFIGURATION.md)

5. 配置 GitHub OAuth（参考 [GITHUB_OAUTH_SETUP.md](./GITHUB_OAUTH_SETUP.md)）

6. 启动开发服务器：
   ```bash
   npm run dev
   ```

6. 在浏览器中打开 `http://localhost:3000`

### 📁 项目结构 - Project Structure

```
time_cal/
├── 📂 src/                          # 源代码目录
│   ├── 📂 app/                     # Next.js 14 App Router
│   │   ├── 📂 api/auth/            # 认证 API 路由
│   │   │   ├── 📄 github/route.ts      # GitHub OAuth 初始化
│   │   │   ├── 📄 callback/route.ts    # OAuth 回调处理
│   │   │   ├── 📄 logout/route.ts      # 登出处理
│   │   │   └── 📄 me/route.ts         # 获取用户信息
│   │   ├── 📂 auth/                # 认证页面
│   │   │   ├── 📄 login/page.tsx       # 登录页面
│   │   │   └── 📄 callback/page.tsx    # 认证回调页面
│   │   ├── 📄 dashboard/page.tsx    # 仪表板 (需认证)
│   │   ├── 📄 sleep/page.tsx        # 睡眠记录 (需认证)
│   │   ├── 📄 activities/page.tsx   # 活动记录 (需认证)
│   │   ├── 📄 statistics/page.tsx   # 统计分析 (需认证)
│   │   └── 📄 layout.tsx            # 根布局组件
│   ├── 📂 components/               # React 组件库
│   │   ├── 📂 activities/          # 活动相关组件
│   │   ├── 📂 sleep/               # 睡眠相关组件
│   │   ├── 📂 forms/               # 表单组件
│   │   ├── 📂 charts/              # 图表组件
│   │   ├── 📂 layout/              # 布局组件
│   │   ├── 📂 ui/                  # 基础 UI 组件 (shadcn/ui)
│   │   ├── 📂 auth/                # 认证相关组件
│   │   └── 📂 debug/               # 调试工具组件
│   ├── 📂 contexts/                # React Context 状态管理
│   │   └── 📄 auth-context.tsx       # JWT 认证上下文
│   ├── 📂 lib/                     # 工具函数和配置
│   │   ├── 📄 auth.ts               # JWT 工具和类型
│   │   ├── 📄 oauth-store.ts        # PKCE 验证器存储
│   │   ├── 📄 supabase.ts           # 数据库连接 (仅数据操作)
│   │   ├── 📂 database/             # 数据库操作服务
│   │   └── 📂 migration/           # 数据迁移工具
│   ├── 📂 types/                   # TypeScript 类型定义
│   │   ├── 📄 database.ts           # 数据库类型
│   │   └── 📄 index.ts              # 通用类型
│   └── 📄 middleware.ts            # Next.js 中间件
├── 📂 migrations/                   # 数据库迁移文件
│   ├── 📄 001_add_github_auth.sql      # GitHub 认证表
│   └── 📄 002_native_github_auth.sql   # 原生 GitHub OAuth 表
├── 📂 openspec/                    # OpenSpec 规范管理
│   ├── 📂 changes/                  # 变更记录
│   │   ├── 📂 integrate-github-auth/     # GitHub 集成 (已完成)
│   │   └── 📂 replace-supabase-auth-with-native-github-oauth/  # 原生 OAuth (最新)
│   └── 📂 specs/                    # 功能规格定义
├── 📂 docs/                        # 项目文档
├── 📂 backup/                      # 备份文件
├── 📄 package.json                 # 项目依赖和脚本
├── 📄 tsconfig.json                # TypeScript 配置
├── 📄 next.config.js               # Next.js 配置
├── 📄 tailwind.config.js           # Tailwind CSS 配置
├── 📄 .env.example                 # 环境变量示例
└── 📄 README.md                    # 项目说明文档
```

## 技术栈 - Tech Stack

### 🎯 核心框架
- **前端框架**: Next.js 14 (App Router) with React 18
- **开发语言**: TypeScript
- **样式方案**: Tailwind CSS + shadcn/ui
- **UI组件库**: Radix UI + Lucide Icons

### 🔐 认证系统 (最新重构)
- **认证方式**: Native GitHub OAuth2 + JWT
- **安全特性**: PKCE (Proof Key for Code Exchange) + CSRF 保护
- **会话管理**: JWT with secure httpOnly cookies
- **数据库**: PostgreSQL (仅数据操作，无认证)

### 🗄️ 数据与状态
- **数据库**: Supabase (PostgreSQL)
- **状态管理**: React Context API
- **类型安全**: TypeScript 类型定义
- **数据迁移**: 自动化迁移脚本

### 🛠️ 开发工具
- **规范管理**: OpenSpec 驱动的开发流程
- **代码质量**: ESLint + TypeScript 严格模式
- **构建工具**: Next.js 内置构建系统
- **开发环境**: Next.js Dev Server

## 🔐 认证系统 - Authentication

### 🚀 原生 GitHub OAuth2 认证 (最新实现)

本应用采用**原生 GitHub OAuth2 + JWT** 认证架构，提供现代化、安全的用户认证体验：

#### 🔄 认证流程概览
```
用户点击 "使用 GitHub 登录"
    ↓
应用生成 PKCE 验证器 + CSRF 状态参数
    ↓
重定向到 GitHub OAuth 授权页面
    ↓
用户授权应用访问权限
    ↓
GitHub 重定向到应用回调端点
    ↓
验证 PKCE + 获取访问令牌
    ↓
获取用户信息并创建 JWT 会话
    ↓
设置安全 Cookie 并重定向到仪表板
```

#### ✨ 核心特性
- **🔒 企业级安全**: PKCE 验证 + CSRF 保护 + 安全 Cookie
- **⚡ 高性能**: 直接 GitHub OAuth，无第三方认证服务依赖
- **🎯 简化架构**: 移除 Supabase Auth，使用原生 JWT 会话管理
- **🔄 自动同步**: 每次登录自动同步最新 GitHub 用户信息
- **💾 数据持久化**: 安全 JWT 会话，支持跨浏览器会话保持
- **🛡️ 隐私保护**: 无需密码管理，仅使用 GitHub 身份认证

#### 🏗️ 技术实现架构
- **认证协议**: GitHub OAuth 2.0 + Authorization Code Flow
- **安全标准**: PKCE (Proof Key for Code Exchange)
- **令牌管理**: JWT with RS256 签名 + httpOnly secure cookies
- **前端框架**: Next.js 14 + React Context + TypeScript
- **后端 API**: Next.js API Routes + Edge Runtime
- **数据库**: PostgreSQL (仅数据存储，无认证依赖)
- **中间件**: Next.js Middleware 路由保护

### 📚 详细文档

- **[GitHub OAuth Setup Guide](./GITHUB_OAUTH_SETUP.md)**: 完整的配置和故障排除指南
- **技术实现细节**: 认证流程、API 调用、状态管理
- **常见问题解决**: 重定向循环、配置错误、调试方法
- **安全最佳实践**: 密钥管理、会话安全、数据保护

### 🚨 开发者注意事项

1. **GitHub OAuth App 配置**:
   - 回调 URL 设置为: `${YOUR_DOMAIN}/api/auth/callback`
   - 确保应用类型为 "Web application"
   - 配置正确的授权范围: `user:email read:user`

2. **环境变量配置**:
   ```bash
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_jwt_secret_key_32_chars_minimum
   ```

3. **开发测试流程**:
   - 在开发环境完整测试 OAuth 流程
   - 验证 PKCE 验证器存储和清理
   - 测试错误场景和边界情况
   - 检查 Cookie 安全配置

4. **生产部署注意事项**:
   - 使用强随机的 JWT 密钥
   - 确保 HTTPS 协议
   - 配置正确的生产回调 URL
   - 监控认证成功率和错误日志

## 开发指南 - Development Guide

### 添加新功能 - Adding New Features

1. 查看 `openspec/` 目录中的规格说明
2. 创建对应的模块文件
3. 更新 `tasks.md` 进度
4. 添加相应的测试

### 样式规范 - Style Guidelines

- 使用 CSS Grid 和 Flexbox 进行布局
- 移动优先的响应式设计
- 遵循 BEM 命名约定
- 使用 CSS 变量管理主题色彩

### 数据存储 - Data Storage

应用使用 LocalStorage 进行数据持久化：

```javascript
// 存储数据
localStorage.setItem('sleepData', JSON.stringify(data));

// 读取数据
const data = JSON.parse(localStorage.getItem('sleepData') || '[]');
```

## 贡献指南 - Contributing

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证 - License

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 更新日志 - Changelog

### v2.0.0 (2025-10-23) - 认证系统重构 🚀
- 🔐 **重大重构**: 移除 Supabase Auth，实现原生 GitHub OAuth2 + JWT 认证
- 🛡️ **安全升级**: 集成 PKCE (Proof Key for Code Exchange) + CSRF 保护
- ⚡ **性能优化**: 直接 GitHub OAuth 认证，减少第三方依赖
- 🎯 **架构简化**: JWT 会话管理，安全 Cookie 存储
- 📝 **API 重构**: 新增 `/api/auth/*` 路由，完整 OAuth 流程支持
- 🔄 **数据迁移**: 保持现有用户数据完整性
- 🧪 **开发工具**: 调试工具和日志系统优化

### v1.0.0 (2024-10-16) - 完整实现 ✅
- ✨ 初始版本发布
- 🛏️ 睡眠记录功能
  - 记录每日起床和睡觉时间
  - 自动计算睡眠时长
  - 睡眠历史查看和编辑
  - 智能睡眠建议
- 📝 活动记录功能
  - 多类别活动记录（工作、个人、休闲、运动、学习、其他）
  - 快速记录和详细记录两种方式
  - 活动时长自动计算
  - 活动编辑和删除功能
- 📊 统计分析功能
  - 时间分布饼图
  - 周趋势柱状图
  - 目标进度可视化
  - 睡眠模式分析
- 📈 数据导出功能
  - CSV格式数据导出
  - 详细时间管理报告生成
  - 打印友好报告
- 🎨 用户界面
  - 响应式设计，支持移动端和桌面端
  - 现代化UI设计和流畅动画
  - 无障碍功能支持
  - 键盘快捷键支持
- 🔧 技术特性
  - 本地数据存储，保护隐私
  - 无需服务器，离线可用
  - 现代浏览器兼容
  - 模块化代码架构