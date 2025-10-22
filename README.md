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
   # 编辑 .env.local 添加 Supabase 配置
   ```

4. 配置 GitHub OAuth（参考 [GITHUB_OAUTH_SETUP.md](./GITHUB_OAUTH_SETUP.md)）

5. 启动开发服务器：
   ```bash
   npm run dev
   ```

6. 在浏览器中打开 `http://localhost:3000`

### 项目结构 - Project Structure

```
time_cal/
├── src/                    # 源代码目录
│   ├── app/               # Next.js App Router
│   │   ├── auth/         # 认证页面
│   │   ├── dashboard/    # 仪表板
│   │   ├── sleep/        # 睡眠记录
│   │   ├── activities/   # 活动记录
│   │   └── statistics/   # 统计分析
│   ├── components/       # React 组件
│   │   ├── ui/          # 基础 UI 组件
│   │   ├── forms/       # 表单组件
│   │   ├── charts/      # 图表组件
│   │   └── layout/      # 布局组件
│   ├── contexts/        # React Context
│   ├── lib/             # 工具库
│   └── types/           # TypeScript 类型定义
├── migrations/           # 数据库迁移文件
├── openspec/            # OpenSpec 规范文件
├── public/              # 静态资源
└── docs/               # 文档目录
```

## 技术栈 - Tech Stack

- **前端框架**: Next.js 14 with React 18
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **UI组件**: Radix UI
- **认证**: Supabase Auth with GitHub OAuth
- **数据库**: Supabase (PostgreSQL)
- **状态管理**: React Context API
- **规范**: OpenSpec 驱动的开发流程

## 认证 - Authentication

### 🔐 GitHub OAuth 认证流程

本应用使用 GitHub OAuth 进行用户认证，提供安全、便捷的登录体验：

#### 认证流程概览
```
用户点击 "使用 GitHub 登录"
    ↓
重定向到 GitHub 授权页面
    ↓
用户授权应用访问权限
    ↓
GitHub 重定向到 Supabase 处理认证
    ↓
创建用户会话并同步用户信息
    ↓
重定向到应用仪表板
```

#### 主要特性
- **安全登录**: 通过 GitHub OAuth 安全认证，无需管理密码
- **自动注册**: 首次登录自动创建用户档案
- **数据同步**: 每次登录自动同步最新的 GitHub 用户信息
- **无缝体验**: 认证状态持久化，支持跨会话保持登录
- **错误处理**: 完善的错误处理和用户友好的错误提示

#### 技术实现
- **认证提供方**: GitHub OAuth 2.0
- **后端服务**: Supabase Auth
- **前端框架**: Next.js with React Context
- **会话管理**: JWT tokens with secure storage
- **数据库**: PostgreSQL with GitHub 用户字段

### 📚 详细文档

- **[GitHub OAuth Setup Guide](./GITHUB_OAUTH_SETUP.md)**: 完整的配置和故障排除指南
- **技术实现细节**: 认证流程、API 调用、状态管理
- **常见问题解决**: 重定向循环、配置错误、调试方法
- **安全最佳实践**: 密钥管理、会话安全、数据保护

### 🚨 开发者注意事项

1. **GitHub OAuth App 配置**: 确保回调 URL 正确设置为 Supabase 认证地址
2. **Supabase 配置**: 启用 GitHub 提供商并配置正确的站点 URL
3. **环境变量**: 管理好认证相关的环境变量
4. **测试流程**: 在开发环境完整测试 OAuth 流程

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