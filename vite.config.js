import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    // Split heavy vendor libraries into separate chunks
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    'vendor-supabase': ['@supabase/supabase-js'],
                    'vendor-query': ['@tanstack/react-query'],
                    'vendor-utils': ['date-fns', 'lucide-react', 'zustand'],
                },
            },
        },
        // Raise the warning threshold slightly since we now split chunks
        chunkSizeWarningLimit: 400,
    },
});
