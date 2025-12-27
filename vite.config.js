import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
    root: 'client',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
    },
    server: {
        allowedHosts: ['emendable-unconcordantly-angele.ngrok-free.dev'],
        proxy: {
            '/socket.io': {
                target: 'http://localhost:3000',
                ws: true,
            },
        },
    },
    resolve: {
        alias: {
            '@shared': path.resolve(__dirname, './shared'),
        },
    },
});
