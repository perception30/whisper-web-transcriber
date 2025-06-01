/*! coi-serviceworker v0.1.6 - Guido Zuidhof, licensed under MIT */
// Service worker to enable Cross-Origin Isolation
// This is needed for SharedArrayBuffer support in browsers

if (typeof window === 'undefined') {
    self.addEventListener("install", () => self.skipWaiting());
    self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

    self.addEventListener("message", e => {
        if (e.data && e.data.type === "deregister") {
            self.registration
                .unregister()
                .then(() => {
                    return self.clients.matchAll();
                })
                .then(clients => {
                    clients.forEach(client => {
                        client.navigate(client.url);
                    });
                });
        }
    });

    self.addEventListener("fetch", function(e) {
        if (e.request.cache === "only-if-cached" && e.request.mode !== "same-origin") {
            return;
        }

        e.respondWith(
            fetch(e.request)
                .then(res => {
                    if (res.status === 0) {
                        return res;
                    }

                    const newHeaders = new Headers(res.headers);
                    newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
                    newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");

                    return new Response(res.body, {
                        status: res.status,
                        statusText: res.statusText,
                        headers: newHeaders
                    });
                })
                .catch(e => console.error(e))
        );
    });

} else {
    (() => {
        const reloadedBySelf = window.sessionStorage.getItem("coiReloadedBySelf");
        window.sessionStorage.removeItem("coiReloadedBySelf");
        const coiIsolated = window.crossOriginIsolated;

        if (!reloadedBySelf && !coiIsolated) {
            window.sessionStorage.setItem("coiReloadedBySelf", "true");
            window.location.reload();
        }

        navigator.serviceWorker.register(window.document.currentScript.src).then(
            registration => {
                if (registration.active && !navigator.serviceWorker.controller) {
                    window.location.reload();
                }
            },
            err => {
                console.error("COI service worker registration failed:", err);
            }
        );
    })();
}