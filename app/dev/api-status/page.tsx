"use client";

import { useState } from 'react';

import ThemeButton from '@components/button/ThemeButton';
import { envConfig } from '@env/config';

import { API_PREFIX, HEALTH_CHECK_PATH, isApiError, scheduleApi, systemApi } from '@utils/api';
import { useErrorNotice } from '@utils/hooks/useErrorNotice';

/**
 * 개발용: FE ↔ BE 연결·오류 안내 확인 (US-03) — /dev/api-status
 */
export default function ApiStatusDevPage() {
  const notifyError = useErrorNotice();
  const [result, setResult] = useState('');
  const [shouldCrash, setShouldCrash] = useState(false);

  if (shouldCrash) throw new Error('개발용 화면 오류');

  const run = async (label: string, request: () => Promise<unknown>) => {
    try {
      const body = await request();
      setResult(`${label}: 성공\n${JSON.stringify(body, null, 2) ?? '(본문 없음)'}`);
    } catch (error) {
      notifyError(error);
      setResult(
        isApiError(error)
          ? `${label}: 실패\nstatus ${error.status} · code ${error.code}\n${error.message}\n${JSON.stringify(error.problem ?? null, null, 2)}`
          : `${label}: 실패\n${String(error)}`
      );
    }
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col gap-4 p-6 text-sm">
      <h1 className="text-lg font-bold">개발용 · API 연결 확인 (US-03)</h1>
      <p className="text-tp-muted">
        서버: {envConfig.apiBaseUrl || '(NEXT_PUBLIC_API_BASE_URL 없음)'}
        {API_PREFIX}
      </p>
      <div className="flex flex-wrap gap-2">
        <ThemeButton variant="primary" onClick={() => void run(`상태 확인 GET ${HEALTH_CHECK_PATH}`, systemApi.checkHealth)}>
          서버 상태 확인
        </ThemeButton>
        <ThemeButton onClick={() => void run('없는 일정 GET /schedules/999999', () => scheduleApi.getById(999999))}>
          404 오류 받아 보기
        </ThemeButton>
        <ThemeButton onClick={() => void run('잘못된 조회 GET /schedules (from·to 없음)', () => scheduleApi.getList({ from: '', to: '' }))}>
          400 오류 받아 보기
        </ThemeButton>
        <ThemeButton variant="danger" onClick={() => setShouldCrash(true)}>
          화면 오류 내 보기
        </ThemeButton>
      </div>
      <pre className="whitespace-pre-wrap rounded-lg border border-tp-line bg-tp-panel p-3">{result || '버튼을 눌러 보세요. 실패하면 화면 아래에 짧은 안내가 뜹니다.'}</pre>
    </main>
  );
}
