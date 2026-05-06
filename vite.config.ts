import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig(({mode}) => {
  const sharedEnv = process.env.SHARED_ENV_PATH
    ? dotenv.config({ path: process.env.SHARED_ENV_PATH }).parsed ?? {}
    : {};
  const localEnv = loadEnv(mode, '.', '');
  const geminiApiKey =
    process.env.GEMINI_API_KEY ||
    localEnv.GEMINI_API_KEY ||
    sharedEnv.GEMINI_API_KEY ||
    sharedEnv.GOOGLE_API_KEY ||
    '';

  return {
    plugins: [react(), tailwindcss(), cloudflare()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
