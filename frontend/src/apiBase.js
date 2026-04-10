/** Dev: FastAPI on port 8000. Prod: same host, API under /bookclub (Caddy strips prefix to backend). */
export function apiBase() {
  return import.meta.env.DEV ? 'http://localhost:8000' : '/bookclub'
}

export function apiUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`
  return `${apiBase()}${p}`
}

export function bookclubWsUrl() {
  if (import.meta.env.DEV) {
    return 'ws://localhost:8000/ws'
  }
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}/bookclub/ws`
}
