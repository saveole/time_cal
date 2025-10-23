// 代理配置测试工具
import { getProxyConfig, shouldUseProxy, createProxyFetch } from './proxy-config'

export function testProxyConfiguration() {
  console.log('🔧 正在测试代理配置...')

  const proxyConfig = getProxyConfig()

  console.log('📋 当前代理配置:')
  console.log(`  HTTP_PROXY: ${proxyConfig.http || '未配置'}`)
  console.log(`  HTTPS_PROXY: ${proxyConfig.https || '未配置'}`)
  console.log(`  NO_PROXY: ${proxyConfig.noProxy || '未配置'}`)

  // 测试 URL 路由
  const testUrls = [
    'https://api.github.com/user',
    'https://github.com/login/oauth/access_token',
    'http://localhost:3000',
    'https://api.github.com/user/emails'
  ]

  console.log('\n🌐 URL 代理路由测试:')
  testUrls.forEach(url => {
    const useProxy = shouldUseProxy(url)
    console.log(`  ${url} -> ${useProxy ? '🔗 代理' : '🏠 直连'}`)
  })

  // 测试代理获取
  console.log('\n🚀 正在测试代理获取...')
  const proxyFetch = createProxyFetch()

  // 测试 GitHub API 调用
  const testGitHubCall = async () => {
    try {
      console.log('  正在测试 GitHub API 调用...')
      const response = await proxyFetch('https://api.github.com/rate_limit', {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'Time-Cal-App/1.0'
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log(`  ✅ GitHub API 调用成功`)
        console.log(`  📊 速率限制信息: ${JSON.stringify(data.resources?.core || {}, null, 2)}`)
      } else {
        console.log(`  ❌ GitHub API 调用失败: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.log(`  💥 GitHub API 调用错误: ${error}`)
    }
  }

  return testGitHubCall()
}

// 导出供开发使用
if (typeof window !== 'undefined') {
  // 浏览器环境
  (window as any).testProxyConfiguration = testProxyConfiguration
}