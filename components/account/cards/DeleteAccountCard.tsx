"use client";

import { useState } from 'react';

import ThemeButton from '@components/button/ThemeButton';
import { useAuthRequest } from '@components/auth/common/useAuthRequest';
import { meApi } from '@utils/api';
import { passLoginNotice } from '@utils/auth/handoff';
import { goTo } from '@utils/navigation';

import { AccountCard, CardText } from '../common/AccountCard';
import ConfirmDialog from '../common/ConfirmDialog';
import { isReauthRequired, useReauth } from '../reauth/ReauthContext';

const WHAT_IS_DELETED = '탈퇴하면 일정·Todo·D-Day·일기·메모와 계정 정보가 즉시 지워져요. 되돌릴 수 없어요.';

/**
 * 회원 탈퇴 (US-37 AC2·AC5, 06 SITE-09)
 * [회원 탈퇴] → 본인 확인 → 최종 확인('정말 탈퇴할까요?', 기본 초점 [취소]) → [탈퇴하고 데이터 지우기]를 눌러야 DELETE /me.
 * 본인 확인이 끝나도 저절로 지우지 않는다 — 403이면 본인 확인을 다시 거친 뒤 **최종 확인을 다시** 받는다.
 * 204면 이 탭에 남은 값을 지우고 /login(페이지를 새로 열어 화면 캐시도 비움) + '탈퇴가 끝났어요…'
 */
export default function DeleteAccountCard() {
  const { ensureReauth, forgetReauth } = useReauth();
  const [confirming, setConfirming] = useState(false);
  const request = useAuthRequest();

  const start = async () => {
    if (await ensureReauth()) setConfirming(true);
  };

  const remove = async () => {
    let needReauth = false;
    const result = await request.send(
      () => meApi.deleteAccount(),
      (e) => {
        if (!isReauthRequired(e)) return false;
        needReauth = true;
        return true;
      }
    );
    if (needReauth) {
      setConfirming(false);
      forgetReauth();
      await start();
      return;
    }
    if (!result.ok) return;
    clearThisTab();
    passLoginNotice('accountDeleted');
    goTo('/login');
  };

  return (
    <AccountCard title="회원 탈퇴" danger>
      <CardText>{WHAT_IS_DELETED}</CardText>
      <ThemeButton size="md" variant="danger" onClick={() => void start()} className="self-start border-danger-line">
        회원 탈퇴
      </ThemeButton>

      {confirming && (
        <ConfirmDialog
          title="정말 탈퇴할까요?"
          description={WHAT_IS_DELETED}
          confirmLabel="탈퇴하고 데이터 지우기"
          danger
          busy={request.locked}
          error={request.message}
          onConfirm={() => void remove()}
          onCancel={() => setConfirming(false)}
        />
      )}
    </AccountCard>
  );
}

/** 이 탭에 남은 이 회원의 값 (넘겨주던 이메일·구글 흐름 표시 등) */
function clearThisTab() {
  try {
    window.sessionStorage.clear();
  } catch {
    // 못 지워도 탈퇴는 끝났다
  }
}
