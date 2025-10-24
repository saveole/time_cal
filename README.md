# Time Management System - 时间管理系统

A modern time management application with frontend-backend separation architecture, built to help users track daily activities, manage time entries, plan daily schedules, and gain insights into their productivity patterns.

现代化的时间管理系统，采用前后端分离架构，帮助用户追踪日常活动、管理时间条目、制定每日计划，并深入了解生产力模式。

## 🏗️ Architecture Overview - 架构概览

### **Frontend-Backend Separation** ✅
- **Frontend**: React + Vite + TypeScript + TanStack Ecosystem
- **Backend**: Go + Gin + PostgreSQL + JWT Authentication
- **Communication**: RESTful API with comprehensive documentation

### **Frontend Stack** 🎨
- **React 19** with TypeScript for type safety
- **Vite** for lightning-fast development and builds
- **TanStack Query** for server state management
- **TanStack Router** for type-safe routing
- **TanStack Form** for form management
- **TailwindCSS** + shadcn/ui for beautiful UI
- **Zod** for runtime validation

### **Backend Stack** ⚡
- **Go** with Gin framework for high-performance API
- **GORM** for database ORM
- **PostgreSQL** for reliable data storage
- **JWT** for secure authentication
- **Docker** for containerization

## 🚀 Features - 功能特性

### ⏰ **Time Tracking** - 时间追踪
- ✅ Create, read, update, delete time entries
- ✅ Timer functionality with start/stop controls
- ✅ Activity categorization and tagging
- ✅ Duration calculations and time formatting

### 📅 **Daily Planning** - 每日计划
- ✅ Create and manage daily activity plans
- ✅ Set time estimates and track actual time
- ✅ Priority levels (high/medium/low)
- ✅ Activity status tracking (pending/in_progress/completed)

### 📊 **Statistics & Analytics** - 统计分析
- ✅ Multi-timeframe analysis (week/month/year)
- ✅ Category breakdowns with percentage distribution
- ✅ Daily activity charts and trends
- ✅ Productivity insights and averages

### 🔐 **Authentication** - 身份认证
- ✅ JWT-based secure authentication
- ✅ User registration and login
- ✅ Automatic token refresh
- ✅ Protected routes and API endpoints

### 📚 **API Documentation** - API文档
- ✅ Comprehensive API documentation at `/docs`
- ✅ All endpoints documented with examples
- ✅ Request/response payloads and authentication requirements

## 🛠️ Development Setup - 开发环境设置

### Prerequisites - 前置要求
- **Node.js** 18+ and **npm**
- **Go** 1.20+
- **PostgreSQL** (or Docker for containerized database)

### Quick Start - 快速开始

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd time_cal
   ```

2. **Start the backend**:
   ```bash
   cd backend
   go mod download
   go run cmd/server/main.go
   ```
   Backend will run on `http://localhost:8080`

3. **Start the frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`

4. **Access the application**:
   - **Frontend**: http://localhost:5173
   - **API Documentation**: http://localhost:8080/docs
   - **Health Check**: http://localhost:8080/health

## 📁 Project Structure - 项目结构

```
time_cal/
├── frontend/                 # React + Vite frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── contexts/         # React contexts (Auth)
│   │   ├── lib/             # Utilities (API, validation, toast)
│   │   ├── pages/           # Route components
│   │   ├── router/          # TanStack Router configuration
│   │   └── types/           # TypeScript type definitions
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # Go backend API
│   ├── cmd/                 # Application entry points
│   ├── internal/            # Internal application code
│   │   ├── config/          # Configuration management
│   │   ├── handlers/        # HTTP request handlers
│   │   ├── middleware/      # HTTP middleware
│   │   ├── models/          # Database models
│   │   └── services/        # Business logic services
│   ├── pkg/                 # Public library code
│   ├── docs/                # API documentation
│   ├── go.mod
│   └── Dockerfile
├── docker-compose.yml         # Development environment
└── README.md                  # This file
```

## 🔧 Environment Configuration - 环境配置

### Backend Environment Variables
Create `backend/configs/.env`:
```env
# Server
SERVER_PORT=8080
GIN_MODE=debug

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=timecal_user
DB_PASSWORD=your_password
DB_NAME=timecal_db
DB_SSLMODE=disable

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE_HOURS=1
JWT_REFRESH_EXPIRE_HOURS=24

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### Frontend Environment Variables
Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:8080
```

## 🧪 Testing - 测试

### Backend Tests
```bash
cd backend
go test ./internal/services -v
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📚 API Documentation - API文档

Access comprehensive API documentation at:
- **Development**: http://localhost:8080/docs
- **Health Check**: http://localhost:8080/health

The API documentation includes:
- All available endpoints with HTTP methods
- Request/response examples
- Authentication requirements
- Error handling information

## 🚀 Deployment - 部署

### Docker Deployment
```bash
# Start development environment
docker-compose up -d

# Stop services
docker-compose down
```

### Production Deployment
The application is ready for production deployment with:
- ✅ Docker containerization
- ✅ Environment-based configuration
- ✅ Health check endpoints
- ✅ Structured logging
- ✅ CORS configuration

## 🔄 Migration Status - 迁移状态

✅ **COMPLETED**: Next.js + Supabase → React + Go
- ✅ Frontend migrated to Vite + React + TypeScript
- ✅ Backend migrated to Go + Gin + PostgreSQL
- ✅ Authentication system migrated to JWT
- ✅ API documentation and testing implemented
- ✅ Modern development tooling in place

## 🤝 Contributing - 贡献

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License - 许可证

This project is licensed under the MIT License - see the LICENSE file for details.
