"use client";

import { useCallback, useState } from 'react';

import type { Diary, LocalDate } from '@/types/api';
import { useAppDispatch } from '@/app/hooks';
import { diaryChanged, refreshDiaryMarks } from '@store/slices/diarySlice';

import { diaryApi, isApiError } from '@utils/api';

import { DIARY_TOO_LONG_ERROR, validateDiaryContent } from '../utils/diaryUtils';

const SAVE_FAILED = '저장하지 못했어요. 잠시 후 다시 시도하세요.';

/**
 * 일기 쓰기·고치기·지우기 (US-24, 06 일기 창)
 * - 저장 버튼으로만 저장 (자동 저장 없음). 보낸 그대로 PUT (D-032)
 * - 저장 중 잠금, 실패하면 내용 그대로 + 창 안 오류 (D-079). 413은 따로 안내
 * - 저장·삭제 뒤 펜 표시·사이드바를 바로 고치고(diaryChanged) 펜 표시를 다시 받는다
 */
export const useDiaryForm = (date: LocalDate, initial: Diary | null) => {
  const dispatch = useAppDispatch();
  const [saved, setSaved] = useState<Diary | null>(initial);
  const [content, setContent] = useState(initial?.content ?? '');
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);

  const isDirty = content !== (saved?.content ?? '');

  const change = useCallback((value: string) => {
    setContent(value);
    setError(null);
  }, []);

  /** 저장. 성공하면 저장된 일기, 아니면 null */
  const save = useCallback(async (): Promise<Diary | null> => {
    if (isSubmitting) return null;
    const invalid = validateDiaryContent(content);
    setError(invalid);
    setFormError(null);
    if (invalid) return null;
    setIsSubmitting(true);
    try {
      const diary = await diaryApi.put(date, content);
      setSaved(diary);
      setContent(diary.content);
      dispatch(diaryChanged({ date, exists: true }));
      void dispatch(refreshDiaryMarks());
      return diary;
    } catch (caught) {
      if (isApiError(caught) && caught.status === 413) setFormError(DIARY_TOO_LONG_ERROR);
      else if (isApiError(caught) && caught.code === 'VALIDATION_FAILED') setError(caught.errors[0]?.message ?? caught.message);
      else setFormError(isApiError(caught) && caught.message ? caught.message : isApiError(caught) ? null : SAVE_FAILED);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [content, date, dispatch, isSubmitting]);

  const requestDelete = useCallback(() => setIsDeleteConfirming(true), []);
  const cancelDelete = useCallback(() => setIsDeleteConfirming(false), []);

  /** 삭제. 성공하면 true */
  const confirmDelete = useCallback(async () => {
    setIsDeleteConfirming(false);
    if (isSubmitting) return false;
    setIsSubmitting(true);
    setFormError(null);
    try {
      await diaryApi.remove(date);
      setSaved(null);
      setContent('');
      dispatch(diaryChanged({ date, exists: false }));
      void dispatch(refreshDiaryMarks());
      return true;
    } catch (caught) {
      setFormError(isApiError(caught) ? caught.message || null : '삭제하지 못했어요. 잠시 후 다시 시도하세요.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [date, dispatch, isSubmitting]);

  return { content, saved, error, formError, isDirty, isSubmitting, isDeleteConfirming, change, save, requestDelete, cancelDelete, confirmDelete };
};

export type DiaryForm = ReturnType<typeof useDiaryForm>;
