"use client";

import { useCallback, useMemo, useState } from 'react';

import type { Id, Memo } from '@/types/api';

import { isApiError, memoApi } from '@utils/api';

import {
  isMemoEmpty,
  isMemoFormChanged,
  memoToFormValues,
  toMemoCreateRequest,
  toMemoUpdateRequest,
  type MemoFormErrors,
  type MemoFormField,
  type MemoFormValues,
} from '../utils/memoUtils';

export interface UseMemoFormOptions {
  /** 처음 열 메모. null = 새 메모 */
  initialMemo: Memo | null;
  onSaved?: (memo: Memo) => void;
  onDeleted?: (id: Id) => void;
}

const SERVER_FIELDS: Record<string, MemoFormField> = { title: 'title', content: 'content' };

/**
 * 메모 편집 상태·저장·삭제 (OV-06, MO-15)
 *
 * - 저장 버튼으로만 저장 (자동 저장 없음, D-030). 제목·내용이 모두 비면 저장할 수 없다 (US-25 AC)
 * - 서버 400(VALIDATION_FAILED)은 칸별로 보여 준다 (D-047: 둘 다 비면 두 칸 모두)
 * - 삭제는 두 번 눌러 확인 (D-055, 일정 삭제와 같은 방식)
 * - `load(memo)`로 다른 메모(또는 새 메모)를 연다 (메모 창에서 목록을 고를 때)
 */
export const useMemoForm = ({ initialMemo, onSaved, onDeleted }: UseMemoFormOptions) => {
  // 1. State
  const [memo, setMemo] = useState<Memo | null>(initialMemo);
  const [initialValues, setInitialValues] = useState<MemoFormValues>(() => memoToFormValues(initialMemo));
  const [values, setValues] = useState<MemoFormValues>(initialValues);
  const [errors, setErrors] = useState<MemoFormErrors>({});
  /** 칸에 속하지 않는 오류 (네트워크, 404 등) */
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);

  const isDirty = useMemo(() => isMemoFormChanged(initialValues, values), [initialValues, values]);
  const canSave = !isSubmitting && !isMemoEmpty(values);

  // 2. Handlers
  const load = useCallback((next: Memo | null) => {
    const nextValues = memoToFormValues(next);
    setMemo(next);
    setInitialValues(nextValues);
    setValues(nextValues);
    setErrors({});
    setFormError(null);
    setIsDeleteConfirming(false);
  }, []);

  const setField = useCallback((field: MemoFormField, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // 둘 중 하나만 있어도 되므로 한 칸을 고치면 두 칸 오류를 함께 지운다 (D-047)
    setErrors({});
  }, []);

  const applyServerError = useCallback((error: unknown) => {
    if (!isApiError(error)) {
      setFormError('저장하지 못했어요. 잠시 후 다시 시도하세요.');
      return;
    }
    if (error.code === 'VALIDATION_FAILED' && error.errors.length > 0) {
      const next: MemoFormErrors = {};
      const otherMessages: string[] = [];
      error.errors.forEach(({ field, message }) => {
        const formField = SERVER_FIELDS[field];
        if (formField) next[formField] = message;
        else otherMessages.push(message);
      });
      setErrors(next);
      setFormError(otherMessages.length > 0 ? otherMessages.join('\n') : null);
      return;
    }
    setFormError(error.message);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!canSave) return;
    setErrors({});
    setFormError(null);
    setIsSubmitting(true);
    try {
      let saved: Memo;
      if (memo) {
        const patch = toMemoUpdateRequest(memo, values);
        saved = Object.keys(patch).length > 0 ? await memoApi.update(memo.id, patch) : memo;
      } else {
        saved = await memoApi.create(toMemoCreateRequest(values));
      }
      load(saved);
      onSaved?.(saved);
    } catch (error) {
      applyServerError(error);
    } finally {
      setIsSubmitting(false);
    }
  }, [applyServerError, canSave, load, memo, onSaved, values]);

  /** 삭제 → 삭제 확인 (두 번 눌러 확인) */
  const handleDelete = useCallback(async () => {
    if (!memo || isSubmitting) return;
    if (!isDeleteConfirming) {
      setIsDeleteConfirming(true);
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    try {
      await memoApi.remove(memo.id);
      onDeleted?.(memo.id);
    } catch (error) {
      setFormError(isApiError(error) ? error.message : '삭제하지 못했어요. 잠시 후 다시 시도하세요.');
      setIsDeleteConfirming(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [isDeleteConfirming, isSubmitting, memo, onDeleted]);

  const cancelDeleteConfirm = useCallback(() => setIsDeleteConfirming(false), []);

  // 3. Return
  return useMemo(
    () => ({
      memo,
      values,
      errors,
      formError,
      isEdit: memo !== null,
      isDirty,
      canSave,
      isSubmitting,
      isDeleteConfirming,
      load,
      setField,
      handleSubmit,
      handleDelete,
      cancelDeleteConfirm,
    }),
    [memo, values, errors, formError, isDirty, canSave, isSubmitting, isDeleteConfirming, load, setField, handleSubmit, handleDelete, cancelDeleteConfirm]
  );
};

export type MemoForm = ReturnType<typeof useMemoForm>;
