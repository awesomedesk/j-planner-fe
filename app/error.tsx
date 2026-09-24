"use client";

import { useEffect } from 'react';

import ThemeButton from '@components/button/ThemeButton';
import { logger } from '@env/config';

/**
 * 화면을 그리다 오류가 나면 흰 화면 대신 짧은 안내를 보여준다 (US-03)
 */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logger.error('Render error', error);
  }, [error]);

  return (
    <main className="flex h-dvh flex-col items-center justify-center gap-4 bg-tp-bg p-6 text-center text-tp-text">
      <p className="text-base font-semibold">화면을 표시하지 못했어요.</p>
      <p className="text-sm text-tp-muted">잠시 후 다시 시도하세요.</p>
      <ThemeButton variant="primary" size="md" onClick={reset}>
        다시 시도
      </ThemeButton>
    </main>
  );
}
