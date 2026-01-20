import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Load from .env files first, then fallback to process.env (for Render)
  const env = loadEnv(mode, ".", "");
  // On Render, env vars are available via process.env during build
  const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
  // Use hardcoded key as fallback for development (same as in geminiService.ts)
  const perplexityKey =
    env.PERPLEXITY_API_KEY || 
    process.env.PERPLEXITY_API_KEY || 
    "";

  // Debug logging (only in build mode, not in dev)
  if (mode === "production") {
    console.log("🔧 [Vite Config] Build mode:", mode);
    console.log("🔧 [Vite Config] GEMINI_API_KEY found:", !!geminiKey);
    console.log("🔧 [Vite Config] PERPLEXITY_API_KEY found:", !!perplexityKey);
    if (perplexityKey) {
      console.log(
        "🔧 [Vite Config] PERPLEXITY_API_KEY prefix:",
        perplexityKey.substring(0, 10) + "..."
      );
    }
  }

  return {
    server: {
      port: 3000,
      host: true,
      proxy: {
        // Proxy Perplexity API calls during development to avoid CORS
        '/api/perplexity': {
          target: 'https://api.perplexity.ai',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/perplexity/, '/chat/completions'),
          configure: (proxy, _options) => {
            proxy.on('proxyReq', (proxyReq, _req, _res) => {
              // Remove any Authorization header from client request first to avoid conflicts
              proxyReq.removeHeader('authorization');
              // Add API key from environment (server-side only, secure)
              // perplexityKey always has a value (fallback to hardcoded key)
              // Ensure exact format: "Bearer <key>" with no extra spaces
              const authHeader = `Bearer ${perplexityKey.trim()}`;
              proxyReq.setHeader('Authorization', authHeader);
              
              // Ensure Content-Type is set
              if (!proxyReq.getHeader('Content-Type')) {
                proxyReq.setHeader('Content-Type', 'application/json');
              }
              
              // Debug logging in development
              if (mode === "development") {
                console.log('[Vite Proxy] Proxying Perplexity API request');
                console.log('[Vite Proxy] API Key present:', !!perplexityKey);
                console.log('[Vite Proxy] API Key prefix:', perplexityKey.substring(0, 15) + '...');
                console.log('[Vite Proxy] Auth header format:', authHeader.substring(0, 20) + '...');
              }
            });
            
            // Log proxy errors
            proxy.on('error', (err, _req, _res) => {
              console.error('[Vite Proxy] Proxy error:', err);
            });
            
            proxy.on('proxyRes', (proxyRes, _req, _res) => {
              if (mode === "development") {
                console.log('[Vite Proxy] Response status:', proxyRes.statusCode);
                if (proxyRes.statusCode === 401) {
                  console.error('[Vite Proxy] 401 Unauthorized - Check API key validity');
                }
              }
            });
          },
        },
      },
    },
    define: {
      "process.env.API_KEY": JSON.stringify(geminiKey),
      "process.env.GEMINI_API_KEY": JSON.stringify(geminiKey),
      "process.env.PERPLEXITY_API_KEY": JSON.stringify(perplexityKey),
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
