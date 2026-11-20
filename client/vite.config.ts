import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ['react', 'react-dom', 'three', '@react-three/fiber', 'colyseus.js', 'zustand']
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true
  }
});
