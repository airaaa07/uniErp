import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0", // or true
      port: 5173,
      proxy: {
        "/api": {
          target: env.VITE_API_BACKEND_URL || "http://127.0.0.1:8080",
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.log('PROXY ERROR:', err.message);
            });
            proxy.on('proxyReq', (_, req) => {
              console.log('PROXY REQ:', req.method, req.url);
            });
            proxy.on('proxyRes', (proxyRes, req) => {
              console.log('PROXY RES:', proxyRes.statusCode, req.url);
            });
          },
        },
      },
    },
  };
});