# 开发者指南

## 项目概述

时间管理系统是一个基于 Next.js 14 + TypeScript + Supabase 构建的现代化时间管理应用。

## 技术栈

### 前端
- **框架**: Next.js 14 with App Router
- **语言**: TypeScript
- **样式**: Tailwind CSS + shadcn/ui
- **状态管理**: React Context + Hooks
- **图表**: Recharts
- **通知**: react-hot-toast

### 后端
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth
- **实时**: Supabase Realtime
- **存储**: Supabase Storage

### 开发工具
- **包管理**: npm
- **构建**: Next.js
- **代码检查**: ESLint
- **格式化**: Prettier
- **Git**: 版本控制

## 项目结构

```
src/
├── app/                     # Next.js App Router 页面
│   ├── (auth)/            # 认证相关页面
│   ├── dashboard/         # 仪表板
│   ├── sleep/             # 睡眠记录
│   ├── activities/        # 活动管理
│   ├── statistics/        # 统计分析
│   └── migration/         # 数据迁移
├── components/             # 可复用组件
│   ├── ui/                 # UI 基础组件
│   ├── auth/               # 认证组件
│   ├── forms/              # 表单组件
│   ├── activities/         # 活动组件
│   ├── charts/             # 图表组件
│   ├── layout/             # 布局组件
│   └── migration/          # 迁移组件
├── lib/                    # 工具和服务
│   ├── database/           # 数据库服务层
│   ├── migration/          # 数据迁移
│   ├── supabase.ts         # Supabase 客户端
│   └── utils.ts            # 工具函数
├── types/                  # TypeScript 类型
│   └── database.ts         # 数据库类型
└── contexts/               # React Context
    └── auth-context.tsx    # 认证状态
```

## 开发环境设置

### 1. 克隆项目

```bash
git clone <repository-url>
cd time_cal
```

### 2. 安装依赖

```bash
npm install
```

### 3. 环境配置

复制 `.env.example` 到 `.env.local`：

```bash
cp .env.example .env.local
```

配置 Supabase 凭据：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NODE_ENV=development
```

### 4. 启动开发服务器

```bash
npm run dev
```

应用将在 http://localhost:3001 启动。

## 数据库设置

### 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com)
2. 创建新项目
3. 获取项目 URL 和 Anon Key

### 2. 执行 SQL 迁移

在 Supabase SQL 编辑器中执行 `supabase/migrations/001_initial_schema.sql`。

### 3. 配置 RLS 策略

SQL 迁移文件已包含必要的 RLS (Row Level Security) 策略。

## 数据库模式

### 主要表结构

#### profiles
- 用户配置文件
- 扩展 `auth.users` 表
- 存储用户偏好设置

#### sleep_records
- 睡眠记录
- 日期、起床时间、睡觉时间
- 睡眠质量和备注

#### activity_categories
- 活动分类
- 用户自定义分类
- 颜色和图标设置

#### activities
- 活动记录
- 活动名称、分类、描述
- 开始和结束时间
- 实时状态标记

#### goals
- 目标设置
- 日/周/月目标
- 目标完成度跟踪

#### user_preferences
- 用户偏好
- 主题设置
- 语言和时间格式

## API 设计

### 认证 API

```typescript
// 使用 React Context
const { signIn, signUp, signOut } = useAuth()

// 登录
await signIn(email, password)

// 注册
await signUp(email, password)

// 登出
await signOut()
```

### 数据服务 API

```typescript
// 睡眠服务
import { sleepService } from '@/lib/database/sleep'

// 获取睡眠记录
const records = await sleepService.getSleepRecords(userId)

// 创建睡眠记录
await sleepService.upsertSleepRecord(sleepData)

// 活动服务
import { activitiesService } from '@/lib/database/activities'

// 获取活动列表
const activities = await activitiesService.getActivities(userId)

// 创建活动
await activitiesService.createActivity(activityData)
```

## 组件开发

### UI 组件

使用 shadcn/ui 组件库：

```typescript
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
```

### 自定义组件

创建可复用的业务组件：

```typescript
// 表单组件示例
export function SleepForm({ onSubmit }: SleepFormProps) {
  // 组件实现
}

// 图表组件示例
export function TimeDistributionChart({ data }: ChartProps) {
  // 图表实现
}
```

## 状态管理

### Context 模式

使用 React Context 进行状态管理：

```typescript
// 认证状态
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // 状态逻辑
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// 使用状态
const { user, signIn } = useAuth()
```

### 本地状态

使用 useState 和 useEffect 管理组件本地状态：

```typescript
const [loading, setLoading] = useState(false)
const [data, setData] = useState<T[]>([])
```

## 部署

### 1. 构建项目

```bash
npm run build
```

### 2. 部署到 Vercel

```bash
npm install -g vercel
vercel
```

### 3. 环境变量配置

在 Vercel 项目设置中配置环境变量：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 测试

### 单元测试

```bash
npm run test
```

### E2E 测试

```bash
npm run test:e2e
```

### 类型检查

```bash
npm run type-check
```

## 调试

### 开发工具调试

使用浏览器开发者工具调试：
- React DevTools
- Network 面板
- Console 日志

### 日志记录

应用集成了详细的日志记录：
- 认证错误
- 数据库操作错误
- 组件渲染错误

## 贡献指南

### 代码规范

1. **TypeScript**: 所有新代码必须使用 TypeScript
2. **组件结构**: 遵循单一职责原则
3. **命名约定**: 使用清晰、描述性的名称
4. **错误处理**: 实现适当的错误边界和错误处理

### 提交流程

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 创建 Pull Request
5. 代码审查
6. 合并主分支

### 提交信息

使用约定式提交信息：

```
feat: 添加新功能
fix: 修复错误
docs: 更新文档
refactor: 重构代码
test: 添加测试
```

## 故障排除

### 常见问题

**构建错误**：
- 检查 Node.js 版本 (需要 18+)
- 清除 node_modules 重新安装
- 检查环境变量配置

**数据库连接错误**：
- 验证 Supabase URL 和 Key
- 检查 RLS 策略设置
- 确认网络连接

**类型错误**：
- 运行 `npm run type-check`
- 更新 TypeScript 类型定义
- 检查导入路径

### 调试技巧

1. 使用 `console.log()` 进行基本调试
2. 使用 React DevTools 检查组件状态
3. 使用浏览器网络面板检查 API 调用
4. 查看控制台错误信息

## 性能优化

### 代码分割

使用 Next.js 动态导入：

```typescript
import dynamic from 'next/dynamic'

const Component = dynamic(() => import('./Component'), {
  loading: () => <div>Loading...</div>
})
```

### 图片优化

使用 Next.js Image 组件：

```typescript
import Image from 'next/image'

<Image src="/image.jpg" alt="Description" width={500} height={300} />
```

### Bundle 分析

```bash
npm run analyze
```

## 安全考虑

### 认证安全

- 使用 HTTPS 连接
- 实现密码强度验证
- 使用 JWT token 认证
- 设置合理的会话超时

### 数据安全

- 启用 RLS (Row Level Security)
- 验证用户权限
- 使用参数化查询
- 定期备份重要数据

### 输入验证

- 前端表单验证
- 后端数据验证
- 防止 SQL 注入
- XSS 防护

---

**维护者**: 开发团队
**最后更新**: 2024年10月
**版本**: 2.0.0