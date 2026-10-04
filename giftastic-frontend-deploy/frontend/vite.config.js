import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const devBackendOrigin = env.VITE_DEV_BACKEND_ORIGIN || 'http://localhost:8080';
  const devServerPort = Number(env.VITE_DEV_SERVER_PORT || 3000);
  const previewPort = Number(env.PORT || env.VITE_PREVIEW_PORT || 4173);

  return {
    plugins: [react()],
    esbuild: mode === 'production' ? {
      drop: ['console', 'debugger'],
    } : {},
    server: {
      host: '0.0.0.0',
      port: devServerPort,
      proxy: {
        '/api': {
          target: devBackendOrigin,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      host: '0.0.0.0',
      port: previewPort,
    },
  };
});
