import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

export default defineConfig(() => {
  const isCI = process.env.GITHUB_ACTIONS === 'true';
  const base = process.env.VITE_BASE_PATH || (isCI ? '/inTurno/' : '/');

  return {
    base,
    plugins: [
      react(),
      !isCI && basicSsl()
    ].filter(Boolean),
    server: {
      port: 5173,
      host: true
    }
  };
});
