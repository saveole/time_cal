/**
 * 认证日志工具 - Authentication Logger
 * 提供统一的认证相关日志记录功能
 */

interface LogContext {
  userId?: string
  email?: string
  provider?: string
  sessionId?: string
  timestamp?: string
  pathname?: string
}

interface AuthLogEntry {
  level: 'info' | 'warn' | 'error' | 'debug'
  category: string
  message: string
  context?: LogContext
  data?: any
}

class AuthLogger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private logHistory: AuthLogEntry[] = []
  private maxLogHistory = 100

  /**
   * 格式化日志前缀
   */
  private formatPrefix(category: string, emoji: string): string {
    return `${emoji} [${category}]`
  }

  /**
   * 记录日志并维护历史
   */
  private log(entry: AuthLogEntry): void {
    if (!this.isDevelopment) return

    const timestamp = new Date().toISOString()
    const logEntry = {
      ...entry,
      timestamp,
      context: {
        ...entry.context,
        timestamp
      }
    }

    // 维护日志历史
    this.logHistory.push(logEntry)
    if (this.logHistory.length > this.maxLogHistory) {
      this.logHistory.shift()
    }

    // 输出到控制台
    const prefix = this.formatPrefix(entry.category, this.getEmoji(entry.level))
    const logData = {
      ...entry.context,
      ...entry.data,
      timestamp
    }

    switch (entry.level) {
      case 'info':
        console.log(prefix, entry.message, logData)
        break
      case 'warn':
        console.warn(prefix, entry.message, logData)
        break
      case 'error':
        console.error(prefix, entry.message, logData)
        break
      case 'debug':
        console.debug(prefix, entry.message, logData)
        break
    }
  }

  /**
   * 获取表情符号
   */
  private getEmoji(level: string): string {
    const emojis = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      debug: '🔍'
    }
    return (emojis as any)[level] || '📝'
  }

  /**
   * 认证流程开始
   */
  authFlowStart(provider: string, context?: LogContext): void {
    this.log({
      level: 'info',
      category: 'Auth',
      message: `Starting ${provider} authentication flow`,
      context,
      data: { provider }
    })
  }

  /**
   * 认证流程成功
   */
  authFlowSuccess(provider: string, userId: string, context?: LogContext): void {
    this.log({
      level: 'info',
      category: 'Auth',
      message: `${provider} authentication successful`,
      context: { ...context, userId },
      data: { provider, userId }
    })
  }

  /**
   * 认证流程失败
   */
  authFlowError(provider: string, error: any, context?: LogContext): void {
    this.log({
      level: 'error',
      category: 'Auth',
      message: `${provider} authentication failed`,
      context,
      data: {
        provider,
        error: error.message || error,
        code: error.status,
        stack: error.stack
      }
    })
  }

  /**
   * OAuth URL 生成
   */
  oauthUrlGenerated(url: string, provider: string): void {
    this.log({
      level: 'info',
      category: 'OAuth',
      message: 'OAuth URL generated successfully',
      data: { url, provider }
    })
  }

  /**
   * OAuth 回调接收
   */
  oauthCallbackReceived(params: Record<string, string | null>): void {
    this.log({
      level: 'info',
      category: 'Callback',
      message: 'OAuth callback received',
      data: { params }
    })
  }

  /**
   * OAuth 回调错误
   */
  oauthCallbackError(error: string, description?: string): void {
    this.log({
      level: 'error',
      category: 'Callback',
      message: 'OAuth callback error',
      data: { error, description }
    })
  }

  /**
   * 会话状态变化
   */
  sessionStateChanged(event: string, session: any): void {
    this.log({
      level: 'info',
      category: 'Session',
      message: `Session state changed: ${event}`,
      data: {
        event,
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        provider: session?.user?.app_metadata?.provider
      }
    })
  }

  /**
   * 中间件路由保护
   */
  middlewareRouteProtection(pathname: string, hasSession: boolean, action: string): void {
    this.log({
      level: 'info',
      category: 'Middleware',
      message: `Route protection: ${action}`,
      data: { pathname, hasSession, action }
    })
  }

  /**
   * 用户交互事件
   */
  userInteraction(action: string, context?: LogContext): void {
    this.log({
      level: 'info',
      category: 'UI',
      message: `User interaction: ${action}`,
      context,
      data: { action }
    })
  }

  /**
   * 获取日志历史
   */
  getLogHistory(): AuthLogEntry[] {
    return [...this.logHistory]
  }

  /**
   * 清空日志历史
   */
  clearLogHistory(): void {
    this.logHistory = []
  }

  /**
   * 导出日志为 JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logHistory, null, 2)
  }

  /**
   * 分析认证失败原因
   */
  analyzeAuthFailures(): {
    totalErrors: number
    errorsByType: Record<string, number>
    recentErrors: AuthLogEntry[]
  } {
    const errors = this.logHistory.filter(log => log.level === 'error')
    const errorsByType: Record<string, number> = {}

    errors.forEach(error => {
      const category = error.category
      errorsByType[category] = (errorsByType[category] || 0) + 1
    })

    return {
      totalErrors: errors.length,
      errorsByType,
      recentErrors: errors.slice(-10)
    }
  }
}

// 创建全局实例
export const authLogger = new AuthLogger()

// 在开发环境下，将日志工具暴露到全局对象以便调试
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).authLogger = authLogger
  console.log('🔧 [Debug] Auth logger available at window.authLogger')
}

export default authLogger