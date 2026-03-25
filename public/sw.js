const CACHE_NAME = 'novate-persona-v2'
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return
  // Cache API only supports http/https; skip chrome-extension, etc.
  if (!event.request.url.startsWith('http')) return

  event.respondWith(
    caches.match(event.request).then(async (cached) => {
      try {
        const response = await fetch(event.request)

        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }

        return response
      } catch {
        if (cached) return cached

        // SPA fallback for client-side routes when offline/unreachable.
        if (event.request.mode === 'navigate') {
          const shell = await caches.match('/index.html')
          if (shell) return shell
        }

        return Response.error()
      }
    })
  )
})
