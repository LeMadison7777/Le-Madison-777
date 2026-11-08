import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { handleApi as HandleApi } from "./server/api.js";

type ApiHandler = typeof HandleApi;

function localApi(handler: ApiHandler): Plugin {
  return {
    name: "madclothes-local-api",
    configureServer(server) {
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next) => {
        const requestPath = req.url?.split("?", 1)[0];
        if (!req.url?.startsWith("/api/") && requestPath !== "/sitemap.xml" && requestPath !== "/robots.txt") return next();
        try {
          const headers = new Headers();
          for (const [key, value] of Object.entries(req.headers)) {
            if (["host", "connection", "content-length", "transfer-encoding"].includes(key)) continue;
            if (Array.isArray(value)) headers.set(key, value.join(", "));
            else if (value) headers.set(key, value);
          }
          let rawBody: Buffer | undefined;
          if (req.method !== "GET" && req.method !== "HEAD") {
            const chunks: Buffer[] = [];
            for await (const chunk of req) chunks.push(Buffer.from(chunk));
            rawBody = Buffer.concat(chunks);
          }
          const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
          if (requestUrl.pathname === "/sitemap.xml") requestUrl.pathname = "/api/sitemap";
          if (requestUrl.pathname === "/robots.txt") requestUrl.pathname = "/api/robots";
          const request = new Request(requestUrl, {
            method: req.method,
            headers,
            body: rawBody as unknown as BodyInit,
          });
          const response = await handler(request);
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (error) {
          next(error as Error);
        }
      });
    },
  };
}

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  for (const key of ["DATABASE_URL", "NEON_AUTH_JWKS_URL", "ADMIN_EMAIL_ALLOWLIST", "R2_ACCOUNT_ID", "CLOUDFLARE_ACCOUNT_ID", "R2_BUCKET_NAME", "R2_S3_ENDPOINT", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_PUBLIC_BASE_URL", "R2_PUBLIC_URL", "PUBLIC_SITE_URL", "VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY", "VAPID_SUBJECT"]) {
    if (env[key] && !process.env[key]) process.env[key] = env[key];
  }
  const { handleApi } = await import("./server/api.js");
  return {
    // Keep one known local origin so auth redirects, R2 CORS, and browser
    // caches all use the same address instead of Vite silently picking 8083+.
    server: { host: true, port: 8082, strictPort: true, hmr: { overlay: false } },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      localApi(handleApi),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["brand/madclothes-logo.jpg", "icons/apple-touch-icon.png"],
        manifest: {
          name: "Madclothes — Mode d'occasion",
          short_name: "Madclothes",
          description: "Achetez et vendez des vêtements d'occasion au Congo.",
          lang: "fr-CG",
          start_url: "/",
          scope: "/",
          display: "standalone",
          background_color: "#101b2b",
          theme_color: "#e60072",
          orientation: "portrait-primary",
          icons: [
            { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
            { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
          ],
        },
        workbox: {
          importScripts: ["/push-handler.js"],
          navigateFallback: "/index.html",
          navigateFallbackDenylist: [/^\/api\//],
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: ({ url }) => url.pathname.startsWith("/api/"),
              handler: "NetworkOnly",
            },
            {
              urlPattern: /^https:\/\/images\.unsplash\.com\//,
              handler: "StaleWhileRevalidate",
              options: { cacheName: "madclothes-category-art", expiration: { maxEntries: 30, maxAgeSeconds: 7 * 24 * 60 * 60 } },
            },
          ],
        },
        devOptions: { enabled: false },
      }),
    ].filter(Boolean),
    resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  };
});
