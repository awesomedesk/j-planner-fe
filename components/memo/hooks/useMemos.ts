"use client";

import { useCallback, useEffect, useState } from 'react';

import type { Id, Memo } from '@/types/api';

import { memoApi } from '@utils/api';
import { useErrorNotice } from '@utils/hooks/useErrorNotice';

import { sortMemosByRecentUpdate } from '../utils/memoUtils';

/**
 * 메모 전체 목록 (최근 수정 순, D-029)
 * 처음 그릴 때 불러온다. 저장·삭제 뒤에는 upsertMemo·removeMemo로 바로 고치거나 reload로 다시 불러온다.
 */
export const useMemos = () => {
  const notifyError = useErrorNotice();
  const [memos, setMemos] = useState<Memo[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const reload = useCallback(async () => {
    try {
      const list = await memoApi.getList();
      setMemos(sortMemosByRecentUpdate(list));
      setIsLoaded(true);
    } catch (error) {
      notifyError(error);
    }
  }, [notifyError]);

  useEffect(() => {
    let isActive = true;
    memoApi
      .getList()
      .then((list) => {
        if (!isActive) return;
        setMemos(sortMemosByRecentUpdate(list));
        setIsLoaded(true);
      })
      .catch((error: unknown) => {
        if (isActive) notifyError(error);
      });
    return () => {
      isActive = false;
    };
  }, [notifyError]);

  /** 저장한 메모를 목록에 넣고 다시 정렬 (방금 고친 메모가 맨 위로) */
  const upsertMemo = useCallback((memo: Memo) => {
    setMemos((prev) => sortMemosByRecentUpdate([memo, ...prev.filter((item) => item.id !== memo.id)]));
  }, []);

  const removeMemo = useCallback((id: Id) => {
    setMemos((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return { memos, isLoaded, reload, upsertMemo, removeMemo };
};
