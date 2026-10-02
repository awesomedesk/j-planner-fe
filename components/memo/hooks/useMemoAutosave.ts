"use client";

import { useCallback, useEffect, useRef, useState } from 'react';

import type { Id, Memo } from '@/types/api';

import { memoApi } from '@utils/api';
import { useErrorNotice } from '@utils/hooks/useErrorNotice';

import {
  MEMO_AUTOSAVE_DELAY_MS,
  isMemoEmpty,
  memoToFormValues,
  toMemoUpdateRequest,
  type MemoFormField,
  type MemoFormValues,
} from '../utils/memoUtils';

interface UseMemoAutosaveOptions {
  memo: Memo;
  onSaved: (memo: Memo) => void;
  onDeleted: (id: Id) => void;
}

/**
 * 사이드바에서 펼친 메모를 그 자리에서 고치는 상태 — 이 자리만 자동 저장 (D-057, D-030의 예외)
 *
 * - 입력이 1초 멈추면 바뀐 칸만 PATCH. `saveNow()`(다른 곳을 누를 때)는 바로 저장
 * - 제목·내용이 모두 빈 동안에는 저장하지 않는다
 * - 접으면(이 훅을 쓰는 부품이 사라지면) 남은 변경을 저장하고, 모두 비어 있으면 그 메모를 삭제 (확인 없음)
 */
export const useMemoAutosave = ({ memo, onSaved, onDeleted }: UseMemoAutosaveOptions) => {
  const notifyError = useErrorNotice();
  const [values, setValues] = useState<MemoFormValues>(() => memoToFormValues(memo));
  /** 화면 값과 같지만 타이머·정리 함수에서 최신 값을 읽으려고 둔다 */
  const valuesRef = useRef(values);
  /** 서버에 저장됐다고 보는 값 (보내는 중인 값 포함 → 같은 변경을 두 번 보내지 않음) */
  const savedRef = useRef<Memo>(memo);
  const timerRef = useRef<number | null>(null);
  const callbacksRef = useRef({ onSaved, onDeleted });
  callbacksRef.current = { onSaved, onDeleted };

  const clearTimer = () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const saveNow = useCallback(async () => {
    clearTimer();
    const current = valuesRef.current;
    if (isMemoEmpty(current)) return;
    const before = savedRef.current;
    const patch = toMemoUpdateRequest(before, current);
    if (Object.keys(patch).length === 0) return;
    savedRef.current = { ...before, ...patch };
    try {
      const saved = await memoApi.update(before.id, patch);
      savedRef.current = saved;
      callbacksRef.current.onSaved(saved);
    } catch (error) {
      savedRef.current = before;
      notifyError(error);
    }
  }, [notifyError]);

  const setField = useCallback(
    (field: MemoFormField, value: string) => {
      const next = { ...valuesRef.current, [field]: value };
      valuesRef.current = next;
      setValues(next);
      clearTimer();
      if (!isMemoEmpty(next)) timerRef.current = window.setTimeout(() => void saveNow(), MEMO_AUTOSAVE_DELAY_MS);
    },
    [saveNow]
  );

  // 접을 때: 모두 비었으면 삭제, 아니면 남은 변경 저장
  useEffect(() => {
    const finish = async () => {
      clearTimer();
      if (!isMemoEmpty(valuesRef.current)) {
        await saveNow();
        return;
      }
      const { id } = savedRef.current;
      try {
        await memoApi.remove(id);
        callbacksRef.current.onDeleted(id);
      } catch (error) {
        notifyError(error);
      }
    };
    return () => void finish();
  }, [notifyError, saveNow]);

  return { values, setField, saveNow };
};
