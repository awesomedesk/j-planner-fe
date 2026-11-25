"use client";

import { useEffect, useState } from 'react';

import type { Diary, LocalDate } from '@/types/api';
import { useAppSelector } from '@/app/hooks';
import { selectDiaryRevision } from '@store/slices/diarySlice';

import { diaryApi, isApiError } from '@utils/api';
import { useErrorNotice } from '@utils/hooks/useErrorNotice';

/**
 * 그날 일기 받기 (GET /diaries/{date}). 404 = 안 쓴 날 → null, 오류를 띄우지 않는다 (06 불러오기)
 * 날짜가 바뀌거나 일기를 저장·삭제하면(revision) 다시 받는다. 내용은 로그에 남기지 않는다
 */
export const useDiaryEntry = (date: LocalDate) => {
  const notifyError = useErrorNotice();
  const revision = useAppSelector(selectDiaryRevision);
  const [loaded, setLoaded] = useState<{ key: string; diary: Diary | null } | null>(null);
  const key = `${date}#${revision}`;

  useEffect(() => {
    let isActive = true;
    diaryApi
      .get(date)
      .then((diary) => isActive && setLoaded({ key, diary }))
      .catch((error: unknown) => {
        if (!isActive) return;
        if (isApiError(error) && error.status === 404) setLoaded({ key, diary: null });
        else notifyError(error);
      });
    return () => {
      isActive = false;
    };
  }, [date, key, notifyError]);

  // 날짜가 바뀌어 받는 중이면 앞 날짜의 일기를 보여 주지 않는다 (같은 날 다시 받는 동안은 그대로)
  const sameDate = loaded?.key.startsWith(`${date}#`) ?? false;
  return { diary: sameDate ? (loaded?.diary ?? null) : null, isLoaded: sameDate };
};
