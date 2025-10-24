import { AuthTokens } from '../types';

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    REFRESH: '/api/v1/auth/refresh',
    LOGOUT: '/api/v1/auth/logout',
    ME: '/api/v1/auth/me',
  },
  // Time Entries
  TIME_ENTRIES: {
    LIST: '/api/v1/time-entries',
    CREATE: '/api/v1/time-entries',
    GET: (id: string) => `/api/v1/time-entries/${id}`,
    UPDATE: (id: string) => `/api/v1/time-entries/${id}`,
    DELETE: (id: string) => `/api/v1/time-entries/${id}`,
    STATS: '/api/v1/time-entries/stats',
  },
  // Daily Plans
  DAILY_PLANS: {
    LIST: '/api/v1/daily-plans',
    CREATE: '/api/v1/daily-plans',
    TODAY: '/api/v1/daily-plans/today',
    GET: (id: string) => `/api/v1/daily-plans/${id}`,
    UPDATE: (id: string) => `/api/v1/daily-plans/${id}`,
    DELETE: (id: string) => `/api/v1/daily-plans/${id}`,
    UPDATE_ACTIVITY: (planId: string, activityId: string) =>
      `/api/v1/daily-plans/${planId}/activities/${activityId}`,
    STATS: '/api/v1/daily-plans/stats',
  },
  // Statistics
  STATISTICS: {
    OVERVIEW: '/api/v1/statistics/overview',
    PRODUCTIVITY: '/api/v1/statistics/productivity',
    CATEGORIES: '/api/v1/statistics/categories',
    TIMESERIES: '/api/v1/statistics/timeseries',
    INSIGHTS: '/api/v1/statistics/insights',
  },
} as const;

// API Client class
class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  private getAuthHeaders(): Record<string, string> {
    const tokens = this.getTokens();
    if (tokens?.accessToken) {
      return {
        Authorization: `Bearer ${tokens.accessToken}`,
      };
    }
    return {};
  }

  private getTokens(): AuthTokens | null {
    if (typeof window !== 'undefined') {
      const tokensStr = localStorage.getItem('auth_tokens');
      return tokensStr ? JSON.parse(tokensStr) : null;
    }
    return null;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || response.statusText);
    }
    return response.json();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // HTTP Methods
  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(endpoint, this.baseURL);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    return this.request<T>(url.pathname + url.search);
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // Authentication methods
  async login(email: string, password: string) {
    return this.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
  }

  async register(email: string, password: string, name: string) {
    return this.post(API_ENDPOINTS.AUTH.REGISTER, { email, password, name });
  }

  async refreshToken(refreshToken: string) {
    return this.post(API_ENDPOINTS.AUTH.REFRESH, { refreshToken });
  }

  async logout() {
    return this.post(API_ENDPOINTS.AUTH.LOGOUT);
  }

  async getCurrentUser() {
    return this.get(API_ENDPOINTS.AUTH.ME);
  }

  // Time entries methods
  async getTimeEntries(params?: {
    page?: number;
    limit?: number;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }) {
    return this.get(API_ENDPOINTS.TIME_ENTRIES.LIST, params);
  }

  async createTimeEntry(data: {
    description: string;
    startTime: string;
    endTime?: string;
    category: string;
    tags?: string[];
  }) {
    return this.post(API_ENDPOINTS.TIME_ENTRIES.CREATE, data);
  }

  async getTimeEntry(id: string) {
    return this.get(API_ENDPOINTS.TIME_ENTRIES.GET(id));
  }

  async updateTimeEntry(id: string, data: {
    description: string;
    startTime: string;
    endTime?: string;
    category: string;
    tags?: string[];
  }) {
    return this.put(API_ENDPOINTS.TIME_ENTRIES.UPDATE(id), data);
  }

  async deleteTimeEntry(id: string) {
    return this.delete(API_ENDPOINTS.TIME_ENTRIES.DELETE(id));
  }

  async getTimeEntryStats(days?: number) {
    return this.get(API_ENDPOINTS.TIME_ENTRIES.STATS, days ? { days } : undefined);
  }

  // Daily plans methods
  async getDailyPlans(params?: {
    page?: number;
    limit?: number;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
  }) {
    return this.get(API_ENDPOINTS.DAILY_PLANS.LIST, params);
  }

  async createDailyPlan(data: {
    date: string;
    activities: Array<{
      description: string;
      estimatedTime: number;
      actualTime?: number;
      status: string;
      category: string;
      priority: string;
      order: number;
    }>;
    status?: string;
  }) {
    return this.post(API_ENDPOINTS.DAILY_PLANS.CREATE, data);
  }

  async getTodayPlan() {
    return this.get(API_ENDPOINTS.DAILY_PLANS.TODAY);
  }

  async getDailyPlan(id: string) {
    return this.get(API_ENDPOINTS.DAILY_PLANS.GET(id));
  }

  async updateDailyPlan(id: string, data: {
    date: string;
    activities: Array<{
      description: string;
      estimatedTime: number;
      actualTime?: number;
      status: string;
      category: string;
      priority: string;
      order: number;
    }>;
    status?: string;
  }) {
    return this.put(API_ENDPOINTS.DAILY_PLANS.UPDATE(id), data);
  }

  async deleteDailyPlan(id: string) {
    return this.delete(API_ENDPOINTS.DAILY_PLANS.DELETE(id));
  }

  async updateActivity(planId: string, activityId: string, data: {
    description?: string;
    estimatedTime?: number;
    actualTime?: number;
    status?: string;
    category?: string;
    priority?: string;
    order?: number;
  }) {
    return this.put(API_ENDPOINTS.DAILY_PLANS.UPDATE_ACTIVITY(planId, activityId), data);
  }

  async getDailyPlanStats(days?: number) {
    return this.get(API_ENDPOINTS.DAILY_PLANS.STATS, days ? { days } : undefined);
  }

  // Statistics methods
  async getStatisticsOverview(params?: {
    days?: number;
    period?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    return this.get(API_ENDPOINTS.STATISTICS.OVERVIEW, params);
  }

  async getProductivityStats(days?: number) {
    return this.get(API_ENDPOINTS.STATISTICS.PRODUCTIVITY, days ? { days } : undefined);
  }

  async getCategoryStats(params?: {
    days?: number;
    category?: string;
  }) {
    return this.get(API_ENDPOINTS.STATISTICS.CATEGORIES, params);
  }

  async getTimeSeriesData(params?: {
    days?: number;
    metric?: string;
    granularity?: string;
  }) {
    return this.get(API_ENDPOINTS.STATISTICS.TIMESERIES, params);
  }

  async getInsights(days?: number) {
    return this.get(API_ENDPOINTS.STATISTICS.INSIGHTS, days ? { days } : undefined);
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export types for external use
export type { ApiClient };