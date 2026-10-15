"use client";

import { useRef, useState } from 'react';

import { isApiError } from '@utils/api';
import { cardErrorOf, tooManyMessage } from '@utils/auth/authRules';
import { useCountdown } from '@utils/hooks/useCountdown';

export type SendResult<T> = { ok: true; value: T } | { ok: false };

/**
 * 가입·비밀번호 화면에서 서버에 보낼 때 공통 (06 SITE-05 공통 규칙, D-079)
 * - 보내는 중 잠금(두 번 눌러도 요청 한 번)
 * - 429: '요청이 너무 많아요. n초 뒤에…' + 잠금 (Retry-After, 초가 줄어듦)
 * - 화면이 따로 처리하지 않은 오류는 카드 오류 줄 (서버에 못 닿음·5xx는 '잠시 문제가 있어요…')
 */
export function useAuthRequest() {
  const [sending, setSending] = useState(false);
  const sendingRef = useRef(false);
  const [waitSeconds, setWaitSeconds] = useCountdown();
  const [error, setError] = useState<string | null>(null);
  const [tooMany, setTooMany] = useState(false);

  const locked = sending || waitSeconds > 0;

  /**
   * @param handle 화면이 직접 처리할 오류면 true (칸 오류·링크 무효 등)
   */
  const send = async <T>(request: () => Promise<T>, handle?: (error: unknown) => boolean): Promise<SendResult<T>> => {
    if (sendingRef.current || waitSeconds > 0) return { ok: false };
    sendingRef.current = true;
    setSending(true);
    setError(null);
    setTooMany(false);
    try {
      return { ok: true, value: await request() };
    } catch (e) {
      if (isApiError(e) && e.status === 429 && e.retryAfterSeconds) {
        setTooMany(true);
        setWaitSeconds(e.retryAfterSeconds);
      } else if (isApiError(e) && e.status === 429) {
        setError('요청이 너무 많아요. 잠시 뒤 다시 시도해 주세요');
      } else if (!handle?.(e)) {
        setError(cardErrorOf(e));
      }
      return { ok: false };
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  };

  const message = tooMany && waitSeconds > 0 ? tooManyMessage(waitSeconds) : error;

  return { send, sending, locked, message };
}
