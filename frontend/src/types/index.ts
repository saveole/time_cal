export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntry {
  id: string;
  userId: string;
  description: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  category: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface DailyPlan {
  id: string;
  userId: string;
  date: string;
  activities: Activity[];
  totalEstimatedTime: number;
  totalActualTime: number;
  status: 'draft' | 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface Activity {
  id: string;
  description: string;
  estimatedTime: number;
  actualTime?: number;
  status: 'pending' | 'in_progress' | 'completed';
  category: string;
  priority: 'low' | 'medium' | 'high';
  order: number;
}

export interface Statistics {
  totalTrackedTime: number;
  totalTimeToday: number;
  totalTimeThisWeek: number;
  totalTimeThisMonth: number;
  categoryStats: CategoryStat[];
  dailyStats: DailyStat[];
  productivityTrend: ProductivityPoint[];
}

export interface CategoryStat {
  category: string;
  totalTime: number;
  percentage: number;
  color: string;
}

export interface DailyStat {
  date: string;
  totalTime: number;
  activitiesCompleted: number;
}

export interface ProductivityPoint {
  date: string;
  value: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface ApiResponse<T = any> {
  data: T;
  message: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}