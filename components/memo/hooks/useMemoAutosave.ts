"use client";

import { useCallback, useEffect, useRef, useState } from 'react';

import type { Id, Memo } from '@/types/api';

import { useAppDispatch } from '@/app/hooks';
import { showNotice } from '@store/slices/noticeSlice';

import { memoApi } from '@utils/api';

import {
  MEMO_AUTOSAVE_DELAY_MS,
  isMemoEmpty,
  memoToFormValues,
  toMemoUpdateRequest,
  type MemoFormField,
  type MemoFormValues,
} from '../utils/memoUtils';
import { useLatest } from '@utils/hooks/useLatest';

interface UseMemoAutosaveOptions {
  /** 펼칠 때의 메모. 펼칠 때마다 새로 시작하므로(접으면 이 훅을 쓰는 부품이 사라짐) 최신 메모로 시작한다 */
  memo: Memo;
  onSaved: (memo: Memo) => void;
  onDeleted: (id: Id) => void;
}

/** 실패 안내 (D-058) */
export const AUTOSAVE_FAILED_MESSAGE = '저장 못 했어요';
export const AUTODELETE_FAILED_MESSAGE = '지우지 못했어요';

/**
 * 사이드바에서 펼친 메모를 그 자리에서 고치는 상태 — 이 자리만 자동 저장 (D-057, D-030의 예외)
 *
 * - 입력이 1초 멈추면 바뀐 칸만 PATCH. `saveNow()`(칸 밖을 누를 때)는 바로 저장
 * - 제목·내용이 모두 빈 동안에는 저장하지 않는다
 * - `finish()`(접기·메모 창 열기): 남은 변경을 저장하고, 모두 비었으면 그 메모를 삭제 (확인 없음).
 *   성공하면 true → 부르는 쪽이 접는다. 실패하면 false → 펼친 채 '저장 못 했어요' (D-058)
 * - 저장·삭제는 한 줄로 차례대로 보낸다: 앞 요청이 끝나야 다음 요청을 보내고,
 *   보낼 값은 보낼 때 다시 계산한다 → 늦게 온 옛 응답이 기준을 덮거나, 삭제 뒤에 저장이 가는 일이 없다 (D-058)
 * - 비운 채 사이드바가 사라지면(언마운트) 접은 것과 같이 삭제, 고친 채 사라지면 저장 (D-058)
 */
export const useMemoAutosave = ({ memo, onSaved, onDeleted }: UseMemoAutosaveOptions) => {
  const dispatch = useAppDispatch();
  const [values, setValues] = useState<MemoFormValues>(() => memoToFormValues(memo));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  /** 화면 값과 같지만 타이머·줄 선 요청·정리 함수에서 최신 값을 읽으려고 둔다 */
  const valuesRef = useRef(values);
  /** 서버에 저장된 값 (줄 선 요청만 고친다) */
  const savedRef = useRef<Memo>(memo);
  const isDeletedRef = useRef(false);
  /** 사이드바가 사라진 뒤(언마운트)에는 칸 안 안내를 볼 수 없으므로 화면 아래 안내로 알린다 (D-058) */
  const isUnmountedRef = useRef(false);
  /** 저장·삭제 요청 줄. 앞 요청이 끝난 뒤 이어 붙인다 */
  const queueRef = useRef<Promise<unknown>>(Promise.resolve());
  const timerRef = useRef<number | null>(null);
  const callbacksRef = useLatest({ onSaved, onDeleted });

  /** 실패 안내: 펼친 채면 칸 안 한 줄, 사라진 뒤면 화면 아래 안내 */
  const reportFailure = useCallback(
    (message: string) => {
      if (isUnmountedRef.current) dispatch(showNotice(message, 'error'));
      else setErrorMessage(message);
    },
    [dispatch]
  );

  const clearTimer = () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const enqueue = useCallback(<T>(task: () => Promise<T>): Promise<T> => {
    const run = queueRef.current.then(task, task);
    queueRef.current = run.catch(() => undefined);
    return run;
  }, []);

  /** 줄 안에서만 부른다. 보낼 것이 없거나 성공하면 true */
  const saveInQueue = useCallback(async (): Promise<boolean> => {
    const current = valuesRef.current;
    if (isDeletedRef.current || isMemoEmpty(current)) return true;
    const patch = toMemoUpdateRequest(savedRef.current, current);
    if (Object.keys(patch).length === 0) {
      setErrorMessage(null);
      return true;
    }
    try {
      const saved = await memoApi.update(savedRef.current.id, patch);
      if (isDeletedRef.current) return true;
      savedRef.current = saved;
      setErrorMessage(null);
      callbacksRef.current.onSaved(saved);
      return true;
    } catch {
      reportFailure(AUTOSAVE_FAILED_MESSAGE);
      return false;
    }
  }, [reportFailure, callbacksRef]);

  /** 줄 안에서만 부른다. 모두 비었으면 삭제, 아니면 저장 */
  const finishInQueue = useCallback(async (): Promise<boolean> => {
    if (isDeletedRef.current) return true;
    if (!isMemoEmpty(valuesRef.current)) return saveInQueue();
    const { id } = savedRef.current;
    try {
      await memoApi.remove(id);
      isDeletedRef.current = true;
      callbacksRef.current.onDeleted(id);
      return true;
    } catch {
      reportFailure(AUTODELETE_FAILED_MESSAGE);
      return false;
    }
  }, [reportFailure, saveInQueue, callbacksRef]);

  const saveNow = useCallback(() => {
    clearTimer();
    return enqueue(saveInQueue);
  }, [enqueue, saveInQueue]);

  const finish = useCallback(() => {
    clearTimer();
    return enqueue(finishInQueue);
  }, [enqueue, finishInQueue]);

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

  // 사이드바가 사라지면 접은 것과 같이 (D-058). 이미 접었으면 보낼 것이 없어 요청이 없다
  useEffect(() => {
    isUnmountedRef.current = false;
    return () => {
      isUnmountedRef.current = true;
      void finish();
    };
  }, [finish]);

  return { values, errorMessage, setField, saveNow, finish };
};
