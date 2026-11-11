import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
// Carpeta con las validaciones que comparten el servidor y el navegador
const compartido = fileURLToPath(new URL('../shared', import.meta.url));
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@shared': compartido } },
  // En desarrollo, las llamadas a /api se envían al backend
  server: { port: 5173, proxy: { '/api': 'http://localhost:3000' }, fs: { allow: ['..'] } },
});
