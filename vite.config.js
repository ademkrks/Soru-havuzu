import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        proxy: {
            '/sorular': 'http://localhost:5000',
            '/sinav': 'http://localhost:5000',
            '/sonuclar': 'http://localhost:5000',
        },
    },
});
