import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Load from .env files first, then fallback to process.env (for Render)
  const env = loadEnv(mode, ".", "");
  // On Render, env vars are available via process.env during build
  const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
  const perplexityKey =
    env.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY || "";

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
