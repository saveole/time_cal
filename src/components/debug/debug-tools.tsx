'use client'

import { useState, useEffect } from 'react'
import { DebugAuthLogger } from './auth-log-viewer'
import { SessionDebugger } from './session-debugger'

export function DebugTools() {
  const [showSessionDebugger, setShowSessionDebugger] = useState(false)
  const [showAuthLogger, setShowAuthLogger] = useState(true)

  // 只在开发环境显示
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <>
      {/* Auth Logger - 始终显示 */}
      {showAuthLogger && <DebugAuthLogger />}

      {/* Session Debugger - 按需显示 */}
      {showSessionDebugger && <SessionDebugger />}

      {/* 控制按钮 */}
      <div style={{
        position: 'fixed',
        bottom: '10px',
        left: '10px',
        zIndex: 9999,
        display: 'flex',
        gap: '8px',
        padding: '8px',
        background: 'rgba(0, 0, 0, 0.8)',
        borderRadius: '8px',
        backdropFilter: 'blur(4px)'
      }}>
        <button
          onClick={() => setShowSessionDebugger(!showSessionDebugger)}
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            background: '#1f2937',
            color: '#f3f4f6',
            border: '1px solid #374151',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showSessionDebugger ? '隐藏' : '显示'}会话
        </button>
        <button
          onClick={() => setShowAuthLogger(!showAuthLogger)}
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            background: '#1f2937',
            color: '#f3f4f6',
            border: '1px solid #374151',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {showAuthLogger ? '隐藏' : '显示'}日志
        </button>
      </div>
    </>
  )
}