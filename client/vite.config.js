import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: { port: 5173 },
    resolve: {
        alias: {
            'simple-peer': 'simple-peer/simplepeer.min.js',
        },
    },
})
