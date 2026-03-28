import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const githubRepo = process.env.GITHUB_REPOSITORY?.split('/')[1];
  const repoBase = githubRepo ? `/${githubRepo}/` : '/';
  const base = env.VITE_BASE_PATH || repoBase;

  return {
    base,
    plugins: [react(), tailwindcss()],
    test: {
      environment: 'node',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
