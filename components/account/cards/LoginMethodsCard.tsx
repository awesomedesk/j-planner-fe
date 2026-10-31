"use client";

import { useCallback, useEffect, useState } from 'react';

import type { Identity, Me } from '@/types/api';
import ThemeButton from '@components/button/ThemeButton';
import { CardError } from '@components/auth/common/AuthFrame';
import { useAuthRequest } from '@components/auth/common/useAuthRequest';
import { CONNECT_GOOGLE_PATH, isApiError, meApi } from '@utils/api';
import { cardErrorOf } from '@utils/auth/authRules';
import { goTo } from '@utils/navigation';

import { AccountCard, CardSuccess } from '../common/AccountCard';
import ConfirmDialog from '../common/ConfirmDialog';
import { REAUTH_CANCELLED, useReauth } from '../reauth/ReauthContext';
import { formatLinkedDate } from '../utils/accountRules';
import { markGoogleFlow } from '../utils/googleFlow';

const LAST_METHOD_NOTE = '비밀번호를 추가하면 구글 연결을 해제할 수 있어요';

interface LoginMethodsCardProps {
  me: Me;
  /** 이메일 줄의 [비밀번호 추가] → 비밀번호 카드로 */
  onAddPassword: () => void;
  /** 해제 뒤 내 정보 다시 받기 */
  onChanged: () => void;
}

type Load = { kind: 'loading' } | { kind: 'ready'; google: Identity | null } | { kind: 'failed'; message: string };

/**
 * 로그인 수단 (US-37 AC3·AC4, 06 SITE-09) — 이메일(비밀번호 유무) · 구글(연결·해제)
 * - [구글 연결]: 재인증 → 연결 시작 주소로 이동 (결과는 /me?linked=google|error=…)
 * - [연결 해제]: 확인 → 재인증 → DELETE. 마지막 수단(비밀번호 없음)이면 잠금, 서버 409 LAST_IDENTITY도 같은 안내, 404는 목록 다시
 */
export default function LoginMethodsCard({ me, onAddPassword, onChanged }: LoginMethodsCardProps) {
  const { ensureReauth, retryOnReauth } = useReauth();
  const [load, setLoad] = useState<Load>({ kind: 'loading' });
  const [confirming, setConfirming] = useState(false);
  const [lastMethod, setLastMethod] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const request = useAuthRequest();

  const reload = useCallback(async () => {
    try {
      const identities = await meApi.identities();
      setLoad({ kind: 'ready', google: identities.find((i) => i.provider === 'GOOGLE') ?? null });
    } catch (error) {
      setLoad({ kind: 'failed', message: cardErrorOf(error) });
    }
  }, []);

  useEffect(() => {
    let alive = true;
    meApi.identities().then(
      (identities) => alive && setLoad({ kind: 'ready', google: identities.find((i) => i.provider === 'GOOGLE') ?? null }),
      (error) => alive && setLoad({ kind: 'failed', message: cardErrorOf(error) })
    );
    return () => {
      alive = false;
    };
  }, []);

  const connect = async () => {
    if (!(await ensureReauth())) return;
    markGoogleFlow('connect');
    goTo(CONNECT_GOOGLE_PATH);
  };

  const disconnect = async () => {
    setConfirming(false);
    setDone(null);
    if (!(await ensureReauth())) return;
    const result = await request.send(
      () => retryOnReauth(() => meApi.disconnectGoogle()),
      (e) => {
        if (!isApiError(e)) return false;
        if (e.code === 'LAST_IDENTITY') {
          setLastMethod(true);
          return true;
        }
        if (e.status === 404) {
          void reload();
          return true;
        }
        return false;
      }
    );
    if (!result.ok || result.value === REAUTH_CANCELLED) return;
    setDone('구글 연결을 해제했어요');
    await reload();
    onChanged();
  };

  const google = load.kind === 'ready' ? load.google : null;
  const locked = !me.hasPassword || lastMethod;

  return (
    <AccountCard title="로그인 수단">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold">이메일 로그인</span>
        {me.hasPassword ? (
          <span className="text-[13px] text-tp-muted">사용 중</span>
        ) : (
          <ThemeButton size="md" onClick={onAddPassword}>
            비밀번호 추가
          </ThemeButton>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-tp-line pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-semibold">구글</span>
          {load.kind === 'ready' && !google && (
            <ThemeButton size="md" onClick={() => void connect()}>
              구글 연결
            </ThemeButton>
          )}
          {google && (
            <ThemeButton size="md" disabled={locked || request.locked} onClick={() => setConfirming(true)}>
              연결 해제
            </ThemeButton>
          )}
        </div>
        {google && (
          <p className="break-all text-[13px] text-tp-muted">
            <span>{google.email}</span> · {formatLinkedDate(google.linkedAt)} 연결
          </p>
        )}
        {google && locked && <p className="text-xs text-tp-muted">{LAST_METHOD_NOTE}</p>}
        {load.kind === 'failed' && (
          <div className="flex flex-col items-start gap-2">
            <CardError message={load.message} />
            <ThemeButton size="md" onClick={() => void reload()}>
              다시 시도
            </ThemeButton>
          </div>
        )}
      </div>

      <CardError message={request.message} />
      <CardSuccess message={done} />

      {confirming && (
        <ConfirmDialog
          title="구글 연결을 해제할까요?"
          description="이메일과 비밀번호로 계속 로그인할 수 있어요."
          confirmLabel="해제"
          onConfirm={() => void disconnect()}
          onCancel={() => setConfirming(false)}
        />
      )}
    </AccountCard>
  );
}
