import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Load from .env files first, then fallback to process.env (for Render)
  const env = loadEnv(mode, ".", "");
  // On Render, env vars are available via process.env during build
  const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
  // Use hardcoded key as fallback for development (same as in geminiService.ts)
  // Debug logging (only in build mode, not in dev)
  if (mode === "production") {
    console.log("🔧 [Vite Config] Build mode:", mode);
    console.log("🔧 [Vite Config] GEMINI_API_KEY found:", !!geminiKey);
  }

  return {
    server: {
      port: 3000,
      host: true,
      proxy: {
        '/api/gemini': {
          target: 'https://generativelanguage.googleapis.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/gemini/, '/v1beta/models/gemini-2.5-flash:generateContent'),
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, _req, _res) => {
              if (geminiKey) {
                const separator = proxyReq.path.includes('?') ? '&' : '?';
                proxyReq.path += `${separator}key=${geminiKey}`;
              }
            });
            proxy.on('error', (err, _req, _res) => {
              console.error('[Vite Proxy] Error:', err);
            });
          }
        }
      }
    },
    define: {
      "process.env.API_KEY": JSON.stringify(geminiKey),
      "process.env.GEMINI_API_KEY": JSON.stringify(geminiKey),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, "index.html"),
        },
      },
    },
  };
});
