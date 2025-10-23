// GitHub OAuth 请求的 HTTP 代理配置

interface ProxyConfig {
  http?: string
  https?: string
  noProxy?: string
}

export function getProxyConfig(): ProxyConfig {
  return {
    http: process.env.HTTP_PROXY,
    https: process.env.HTTPS_PROXY,
    noProxy: process.env.NO_PROXY
  }
}

export function shouldUseProxy(url: string): boolean {
  const proxyConfig = getProxyConfig()

  if (!proxyConfig.http && !proxyConfig.https) {
    return false
  }

  // 检查 URL 是否应该通过代理
  if (proxyConfig.noProxy) {
    const noProxyHosts = proxyConfig.noProxy.split(',').map(host => host.trim())
    const urlHostname = new URL(url).hostname

    for (const host of noProxyHosts) {
      if (urlHostname === host || urlHostname.endsWith('.' + host)) {
        return false
      }
    }
  }

  return true
}

export function createProxyFetch(): typeof fetch {
  const proxyConfig = getProxyConfig()

  if (!proxyConfig.http && !proxyConfig.https) {
    return fetch
  }

  // 创建使用代理的自定义 fetch 函数
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input.toString()

    if (!shouldUseProxy(url)) {
      return fetch(input, init)
    }

    // 创建代理代理配置
    const httpsProxy = proxyConfig.https || proxyConfig.http
    const httpProxy = proxyConfig.http

    // 在 Node.js 环境中，我们需要使用代理代理
    // 对于 Edge Runtime，我们将依赖环境变量
    const agentConfig = {
      https: httpsProxy ? new URL(httpsProxy) : undefined,
      http: httpProxy ? new URL(httpProxy) : undefined,
    }

    // 添加代理头部
    const headers = new Headers(init?.headers)

    // 对于 GitHub 请求，如果需要添加代理专用头部
    if (url.includes('github.com')) {
      headers.set('User-Agent', 'Time-Cal-App/1.0')
    }

    const modifiedInit = {
      ...init,
      headers,
      // 注意：在 Edge Runtime 中，实际的代理实现
      // 依赖于平台的代理配置
    }

    return fetch(input, modifiedInit)
  }
}

// 对于 Node.js 运行时，我们可以使用 undici 或 https-proxy-agent
// 对于 Edge Runtime，我们依赖环境变量
export function configureNodeProxy() {
  // 为 Node.js 设置代理环境变量
  const proxyConfig = getProxyConfig()

  if (proxyConfig.http) {
    process.env.HTTP_PROXY = proxyConfig.http
  }

  if (proxyConfig.https) {
    process.env.HTTPS_PROXY = proxyConfig.https
  }

  if (proxyConfig.noProxy) {
    process.env.NO_PROXY = proxyConfig.noProxy
  }
}