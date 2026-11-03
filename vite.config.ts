import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dts from 'vite-plugin-dts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // ==========================================================
  // LIBRARY BUILD
  // ==========================================================
  if (mode === 'lib') {
    return {
      plugins: [
        react(),
        dts({
          outDir: 'dist/types',
          tsconfigPath: './tsconfig.app.json',
          include: ['src'],
          exclude: [
            'src/**/*.test.ts',
            'src/**/*.test.tsx',
            'src/**/*.spec.ts',
            'src/main.tsx',
            'src/App.tsx',
          ],
        }),
      ],

      // ✅ Disable copying public/ into dist
      publicDir: false,

      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        },
      },

      build: {
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: true,
        minify: false,
        cssCodeSplit: false,
        copyPublicDir: false, 

        lib: {
          entry: path.resolve(__dirname, 'src/index.tsx'),
          name: 'DashboardFrontend',
          formats: ['es', 'cjs'],
        },

        rollupOptions: {
          external: [
            // React
            'react',
            'react-dom',
            'react/jsx-runtime',
            'react/jsx-dev-runtime',
            'react-router-dom',
            'react-router',

            // MUI
            '@mui/material',
            '@mui/icons-material',
            '@mui/lab',
            '@mui/styles',
            '@mui/x-data-grid',
            '@mui/x-date-pickers',
            /^@mui\/.*/,

            // Emotion
            '@emotion/react',
            '@emotion/styled',
            /^@emotion\/.*/,

            // Peers
            'axios',
            'chart.js',
            /^chart\.js\//,
            'react-chartjs-2',
            'chartjs-plugin-zoom',
            'chartjs-adapter-date-fns',
            'dayjs',
            'formik',
            'yup',
            'recharts',
            'react-helmet',
            'react-draggable',
            'react-toastify',

            // lodash
            'lodash.debounce',

            // Optional internal lib
            '@givc/shared-components',

            // Node built-ins
            /^node:.*/,
          ],

          output: [
            // ES Module output
            {
              format: 'es',
              entryFileNames: 'index.es.js',
              chunkFileNames: 'chunks/[name]-[hash].js',
              assetFileNames: (assetInfo) => {
                if (assetInfo.name?.endsWith('.css')) return 'styles.css';
                return 'assets/[name][extname]';
              },
            },
            // CommonJS output
            {
              format: 'cjs',
              entryFileNames: 'index.cjs.js',
              chunkFileNames: 'chunks/[name]-[hash].cjs',
              assetFileNames: (assetInfo) => {
                if (assetInfo.name?.endsWith('.css')) return 'styles.css';
                return 'assets/[name][extname]';
              },
            },
          ],
        },
      },
    };
  }

  // ==========================================================
  // APP / DEV BUILD
  // ==========================================================
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/dashboard-api': {
          target: env.ABSOLUTE_DASHBOARD_URL,
          changeOrigin: true,
        },
        '/nphies-api': {
          target: env.ABSOLUTE_NPHIES_URL,
          changeOrigin: true,
        },
        '/billing-api': {
          target: env.ABSOLUTE_BILLING_URL,
          changeOrigin: true,
        },
        '/hl7': {
          target: env.ABSOLUTE_HL7_URL,
          changeOrigin: true,
          rewrite: (p) => p.replace('/hl7', ''),
        },
      },
      port: Number(env.PORT || 3500),
      allowedHosts: true,
      cors: true,
    },
  };
});