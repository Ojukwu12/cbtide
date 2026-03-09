self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    return;
  }

  const notification = payload.notification || payload.data || {};
  const title = notification.title || 'New Notification';
  const body = notification.body || notification.message || '';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/favicon.ico',
      data: payload.data || {},
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const notificationData = event.notification?.data || {};
  const title = event.notification?.title || notificationData?.title || '';
  const message = event.notification?.body || notificationData?.message || '';
  const expiresAt = notificationData?.expiresAt || '';

  const params = new URLSearchParams();
  params.set('push_open', '1');
  if (title) params.set('title', title);
  if (message) params.set('message', message);
  if (expiresAt) params.set('expiresAt', expiresAt);

  const targetUrl = `/notifications?${params.toString()}`;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            client.navigate(targetUrl);
          }
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
