import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const normalizeBase = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return '/';
    const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
  };

  const env = loadEnv(mode, '.', '');
  const githubRepo = process.env.GITHUB_REPOSITORY?.split('/')[1];
  const hasCustomDomain = Boolean(
    env.VITE_CUSTOM_DOMAIN || process.env.CUSTOM_DOMAIN || process.env.GITHUB_PAGES_CUSTOM_DOMAIN
  );
  const repoBase = githubRepo ? `/${githubRepo}/` : '/';
  const base = normalizeBase(env.VITE_BASE_PATH || (hasCustomDomain ? '/' : repoBase));

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
