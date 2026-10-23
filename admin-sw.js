// Service worker للوحة التحكم: بيخليها تتنزل كتطبيق ويعرض الإشعارات. مفيش كاش — كل حاجة من النت.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    const w = list.find(c => c.url.includes("admin.html"));
    return w ? w.focus() : self.clients.openWindow("admin.html#/orders");
  }));
});
