// Service worker — push notifications only. We deliberately don't cache
// pages/assets here: Next.js + Vercel already handle CDN and HTTP caching,
// and a misconfigured runtime cache makes deploys feel stale. Keep this
// worker single-purpose.
//
// On a push event we expect a JSON payload like:
//   { title, body, url?, tag?, icon? }
// On notification click we focus an existing tab if one is open at the
// target URL, else open a new one.

self.addEventListener('install', (event) => {
  // Activate immediately on first install so notifications work from the
  // very first subscription.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let data = { title: 'TM FoodStuff', body: 'You have an update.', url: '/', tag: 'tmf', icon: '/icons/icon-192.png' }
  try {
    if (event.data) {
      data = { ...data, ...event.data.json() }
    }
  } catch (_) {
    if (event.data) {
      data.body = event.data.text()
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: data.tag || 'tmf',
      data: { url: data.url || '/' },
      // Renotify on the same tag — useful for order status updates so the
      // customer sees the latest step even if they ignored the previous.
      renotify: true,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = (event.notification.data && event.notification.data.url) || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client && client.url.includes(targetUrl)) {
          return client.focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl)
      }
    })
  )
})
