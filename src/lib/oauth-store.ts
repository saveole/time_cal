// PKCE verifier storage (in production, use Redis or database)
const pkceStore = new Map<string, { verifier: string; expires: number }>()

// Clean up expired PKCE verifiers
setInterval(() => {
  const now = Date.now()
  pkceStore.forEach((value, key) => {
    if (value.expires < now) {
      pkceStore.delete(key)
    }
  })
}, 60000) // Clean up every minute

export function getPkceVerifier(sessionId: string): string | null {
  const data = pkceStore.get(sessionId)
  if (!data || data.expires < Date.now()) {
    pkceStore.delete(sessionId)
    return null
  }
  return data.verifier
}
