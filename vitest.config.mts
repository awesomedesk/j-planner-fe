import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

// 날짜 계산은 한국 시간 기준 (08-api-design 2-2). 테스트도 같은 시간대로 돌린다
process.env.TZ = 'Asia/Seoul';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', '.next/**', 'out/**'],
    css: false,
    env: {
      NEXT_PUBLIC_LOG_LEVEL: 'error',
      NEXT_PUBLIC_API_BASE_URL: 'http://api.test',
    },
  },
});
