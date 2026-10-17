import { useEffect, useState } from 'react';

/** 남은 초를 다시 계산하는 간격. 1초보다 짧게 두어 표시가 1초씩 밀리지 않게 */
const TICK_MS = 250;

/**
 * 끝나는 시각까지 남은 초 (다시 보내기 60초 잠금, 429 Retry-After — US-33·35, D-079)
 * 1초마다 1씩 빼지 않고 끝나는 시각으로 계산한다 — 탭이 뒤에 있어 브라우저가 타이머를 늦춰도 맞게.
 * @returns [남은 초, 새로 시작(초)]
 */
export function useCountdown() {
  const [deadline, setDeadline] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (deadline === null) return;
    const timer = setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSeconds(left);
      if (left === 0) setDeadline(null);
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [deadline]);

  const start = (value: number) => {
    setSeconds(Math.max(0, value));
    setDeadline(value > 0 ? Date.now() + value * 1000 : null);
  };

  return [seconds, start] as const;
}
