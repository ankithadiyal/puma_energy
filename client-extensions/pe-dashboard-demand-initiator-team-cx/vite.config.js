import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    base: '/o/pe-dashboard-demand-initiator-team-cx',
    plugins: [react({
        jsxRuntime: 'classic',
    })],
    build: {
        outDir: './vite-build',
        rollupOptions: {
            external: [
                'react',
                'react-dom',
                /^@clayui.*$/,
            ],
        }
    }
})
