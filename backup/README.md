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

2. 启动开发服务器：
   ```bash
   npm run dev
   ```
   或者使用Python直接运行：
   ```bash
   python3 -m http.server 8000
   ```

3. 在浏览器中打开 `http://localhost:8000`

### 项目结构 - Project Structure

```
time_cal/
├── index.html              # 主页面
├── src/                    # 源代码目录
│   ├── css/               # 样式文件
│   │   ├── main.css      # 主要样式
│   │   └── components.css # 组件样式
│   └── js/                # JavaScript文件
│       ├── app.js        # 应用主逻辑
│       ├── storage.js    # 数据存储
│       ├── utils.js      # 工具函数
│       ├── components.js # UI组件
│       ├── sleep-tracker.js # 睡眠追踪
│       ├── activity-tracker.js # 活动追踪
│       └── statistics.js # 统计分析
├── assets/               # 静态资源
├── openspec/            # OpenSpec规范文件
└── docs/               # 文档目录
```

## 技术栈 - Tech Stack

- **前端**: HTML5, CSS3, JavaScript (ES6+)
- **存储**: LocalStorage (浏览器本地存储)
- **构建**: 静态文件服务 (Python http.server)
- **规范**: OpenSpec 驱动的开发流程

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