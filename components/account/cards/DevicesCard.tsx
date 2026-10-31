"use client";

import { useCallback, useEffect, useState } from 'react';

import type { DeviceSession } from '@/types/api';
import ThemeButton from '@components/button/ThemeButton';
import { CardError } from '@components/auth/common/AuthFrame';
import { useAuthRequest } from '@components/auth/common/useAuthRequest';
import { authApi, isApiError, meApi } from '@utils/api';
import { cardErrorOf } from '@utils/auth/authRules';
import { goTo } from '@utils/navigation';

import { AccountCard, CardSuccess } from '../common/AccountCard';
import ConfirmDialog from '../common/ConfirmDialog';
import { formatDeviceTime } from '../utils/accountRules';

type Load = { kind: 'loading' } | { kind: 'ready'; sessions: DeviceSession[] } | { kind: 'failed'; message: string };

/** 확인 창에 띄울 것: 한 기기 또는 다른 기기 모두 */
type Pending = { kind: 'one'; session: DeviceSession } | { kind: 'others' };

const OTHERS_TITLE = '이 기기는 그대로 두고 다른 기기에서 모두 로그아웃할까요?';

/**
 * 로그인한 기기 (US-37 AC3·AC4, 06 SITE-09) — 서버 순서(최근 사용순) 그대로, 시각은 현지 시각 + 시간대.
 * 원문 IP·User-Agent·세션 값은 서버가 주지 않는다. 재인증 없음(08 계약).
 * - 한 기기 [로그아웃] → 확인 → DELETE /me/sessions/{id}. 지금 기기면 로그인 화면으로, 404면 '이미 로그아웃된 기기예요'
 * - [다른 기기 모두 로그아웃] → 확인 → DELETE /me/sessions. 다른 기기가 없으면 잠금
 * - 목록을 못 읽으면 이 카드에서만 [다시 시도]
 * @param refreshKey 바뀌면 목록을 다시 받는다 (비밀번호 변경 뒤)
 */
export default function DevicesCard({ refreshKey }: { refreshKey: number }) {
  const [load, setLoad] = useState<Load>({ kind: 'loading' });
  const [pending, setPending] = useState<Pending | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const request = useAuthRequest();

  const reload = useCallback(async () => {
    try {
      setLoad({ kind: 'ready', sessions: await meApi.sessions() });
    } catch (error) {
      setLoad({ kind: 'failed', message: cardErrorOf(error) });
    }
  }, []);

  useEffect(() => {
    let alive = true;
    meApi.sessions().then(
      (sessions) => alive && setLoad({ kind: 'ready', sessions }),
      (error) => alive && setLoad({ kind: 'failed', message: cardErrorOf(error) })
    );
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  const confirm = async () => {
    if (!pending) return;
    const target = pending;
    setNotice(null);
    const result = await request.send(
      () => (target.kind === 'one' ? meApi.endSession(target.session.id) : authApi.logoutOtherDevices()),
      (e) => {
        if (!isApiError(e) || e.status !== 404) return false;
        setPending(null);
        setNotice('이미 로그아웃된 기기예요');
        void reload();
        return true;
      }
    );
    if (!result.ok) return;
    setPending(null);
    if (target.kind === 'one' && target.session.current) {
      goTo('/login');
      return;
    }
    await reload();
  };

  const sessions = load.kind === 'ready' ? load.sessions : [];
  const hasOthers = sessions.some((s) => !s.current);

  return (
    <AccountCard title="로그인한 기기">
      {load.kind === 'loading' && <p className="text-[13px] text-tp-muted">불러오는 중…</p>}

      {load.kind === 'failed' && (
        <div className="flex flex-col items-start gap-2">
          <CardError message={load.message} />
          <ThemeButton size="md" onClick={() => void reload()}>
            다시 시도
          </ThemeButton>
        </div>
      )}

      {load.kind === 'ready' && (
        <ul className="flex flex-col divide-y divide-tp-line">
          {sessions.map((session) => (
            <li key={session.id} className="flex flex-wrap items-start justify-between gap-2 py-3 first:pt-0">
              <div className="flex min-w-0 flex-col gap-0.5 text-[13px]">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  {session.device}
                  {session.current && <span className="rounded bg-tp-secondary px-1.5 py-0.5 text-[11px] font-medium text-tp-on-secondary">이 기기</span>}
                </span>
                <span className="text-tp-muted">로그인 {formatDeviceTime(session.loggedInAt)}</span>
                <span className="text-tp-muted">마지막 사용 {formatDeviceTime(session.lastUsedAt)}</span>
                <span className="text-tp-muted">IP {session.ipPrefix}</span>
              </div>
              <ThemeButton size="md" onClick={() => setPending({ kind: 'one', session })}>
                로그아웃
              </ThemeButton>
            </li>
          ))}
        </ul>
      )}

      <CardSuccess message={notice} />
      {!pending && <CardError message={request.message} />}

      {load.kind === 'ready' && (
        <ThemeButton size="md" disabled={!hasOthers || request.locked} onClick={() => setPending({ kind: 'others' })} className="self-start disabled:opacity-60">
          다른 기기 모두 로그아웃
        </ThemeButton>
      )}

      {pending && (
        <ConfirmDialog
          title={pending.kind === 'others' ? OTHERS_TITLE : pending.session.current ? '이 기기에서 로그아웃할까요?' : '선택한 기기를 로그아웃할까요?'}
          confirmLabel="로그아웃하기"
          busy={request.locked}
          error={request.message}
          onConfirm={() => void confirm()}
          onCancel={() => setPending(null)}
        />
      )}
    </AccountCard>
  );
}
