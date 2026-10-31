"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

import { isApiError } from '@utils/api';

import ReauthDialog from './ReauthDialog';

/**
 * 서버 재인증은 5분 (08 13-4). 이 화면은 성공한 시각을 메모리에만 기억하고, 끝나기 조금 전(4분)부터는 다시 묻는다.
 * 그래도 서버가 403 REAUTH_REQUIRED를 주면 다시 묻는다 (제가 정한 부분 — 시계 차이·다른 탭 대비)
 */
export const REAUTH_TRUST_MS = 4 * 60 * 1000;

/** 본인 확인을 취소함 */
export const REAUTH_CANCELLED = Symbol('reauth-cancelled');

export const isReauthRequired = (error: unknown) => isApiError(error) && error.code === 'REAUTH_REQUIRED';

interface ReauthApi {
  /** 기억한 본인 확인이 없으면 창을 열어 묻는다. 확인하면 true, 취소하면 false */
  ensureReauth: () => Promise<boolean>;
  /** 서버가 403을 줬을 때: 기억을 지운다 */
  forgetReauth: () => void;
  /**
   * 민감 작업 보내기: 403 REAUTH_REQUIRED면 다시 묻고 **한 번만** 다시 보낸다 (무한 반복 없음).
   * 다시 묻다가 취소하면 REAUTH_CANCELLED
   */
  retryOnReauth: <T>(send: () => Promise<T>) => Promise<T | typeof REAUTH_CANCELLED>;
}

const ReauthContext = createContext<ReauthApi | null>(null);

export function useReauth(): ReauthApi {
  const value = useContext(ReauthContext);
  if (!value) throw new Error('useReauth는 ReauthProvider 안에서 써요');
  return value;
}

interface ReauthProviderProps {
  hasPassword: boolean;
  hasGoogle: boolean;
  /** 구글 본인 확인에서 막 돌아왔으면 그 시각부터 믿는다 (`/me?reauth=google`) */
  confirmedAt?: number | null;
  children: ReactNode;
}

/** 내 계정 화면의 본인 확인 (US-37, D-085 · SITE-09) — 창은 한 번에 하나 */
export function ReauthProvider({ hasPassword, hasGoogle, confirmedAt = null, children }: ReauthProviderProps) {
  const confirmedAtRef = useRef<number | null>(confirmedAt);
  const [asking, setAsking] = useState<{ resolve: (ok: boolean) => void } | null>(null);

  const ensureReauth = useCallback(() => {
    const at = confirmedAtRef.current;
    if (at !== null && Date.now() - at < REAUTH_TRUST_MS) return Promise.resolve(true);
    return new Promise<boolean>((resolve) => setAsking({ resolve }));
  }, []);

  const forgetReauth = useCallback(() => {
    confirmedAtRef.current = null;
  }, []);

  const retryOnReauth = useCallback(
    async <T,>(send: () => Promise<T>) => {
      try {
        return await send();
      } catch (error) {
        if (!isReauthRequired(error)) throw error;
        forgetReauth();
        if (!(await ensureReauth())) return REAUTH_CANCELLED;
        return send();
      }
    },
    [ensureReauth, forgetReauth]
  );

  const api = useMemo(() => ({ ensureReauth, forgetReauth, retryOnReauth }), [ensureReauth, forgetReauth, retryOnReauth]);

  const finish = (ok: boolean) => {
    if (!asking) return;
    if (ok) confirmedAtRef.current = Date.now();
    setAsking(null);
    asking.resolve(ok);
  };

  return (
    <ReauthContext.Provider value={api}>
      {children}
      {asking && <ReauthDialog hasPassword={hasPassword} hasGoogle={hasGoogle} onConfirmed={() => finish(true)} onCancel={() => finish(false)} />}
    </ReauthContext.Provider>
  );
}
