import { useEffect, useState } from 'react';

/**
 * 1초마다 줄어드는 남은 초 (다시 보내기 60초 잠금, 429 Retry-After — US-33·35, D-079)
 * @returns [남은 초, 새로 시작(초)]
 */
export function useCountdown() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  return [seconds, setSeconds] as const;
}
