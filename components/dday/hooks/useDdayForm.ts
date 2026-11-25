"use client";

import { useCallback, useMemo, useState } from 'react';

import type { Dday, DdayCountType, Id, LocalDate } from '@/types/api';
import { toFormErrors } from '@components/form/serverErrors';

import { ddayApi, isApiError } from '@utils/api';

import {
  DDAY_API_FIELD_TO_FORM_FIELD,
  changeDdayCountType,
  createEmptyDdayValues,
  ddayToFormValues,
  isDdayFormChanged,
  toDdayCreateRequest,
  toDdayUpdateRequest,
  validateDdayForm,
  type DdayFormErrors,
  type DdayFormValues,
} from '../utils/ddayFormUtils';

/** 새 D-Day(기준 날짜) 또는 수정할 D-Day */
export type DdayFormTarget = { mode: 'create'; baseDate: LocalDate } | { mode: 'edit'; dday: Dday };

interface UseDdayFormOptions {
  target: DdayFormTarget;
  onSaved?: (dday: Dday) => void;
  onDeleted?: (id: Id) => void;
}

/**
 * D-Day 입력 창의 상태·저장·삭제 (US-22, 06 D-Day 입력 창)
 * Todo·일정 입력 창과 같은 흐름: FE 검사 → 저장, 서버 오류는 칸별로, 실패하면 입력 그대로 (D-079). 수정은 바뀐 것만 PATCH
 * 삭제는 확인 창(isDeleteConfirming)을 거친다
 */
export const useDdayForm = ({ target, onSaved, onDeleted }: UseDdayFormOptions) => {
  const [initialValues] = useState<DdayFormValues>(() =>
    target.mode === 'edit' ? ddayToFormValues(target.dday) : createEmptyDdayValues(target.baseDate)
  );
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<DdayFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);

  const isEdit = target.mode === 'edit';
  const isDirty = useMemo(() => isDdayFormChanged(initialValues, values), [initialValues, values]);

  const update = useCallback((patch: Partial<DdayFormValues>, clear: (keyof DdayFormErrors)[] = []) => {
    setValues((prev) => ({ ...prev, ...patch }));
    if (clear.length > 0) setErrors((prev) => ({ ...prev, ...Object.fromEntries(clear.map((field) => [field, undefined])) }));
  }, []);

  const setCountType = useCallback(
    (countType: DdayCountType) => {
      setValues((prev) => changeDdayCountType(prev, countType, isEdit ? 'edit' : 'create'));
      setErrors((prev) => ({ ...prev, intervalDays: undefined, lastDaysDays: undefined }));
    },
    [isEdit]
  );

  /** 저장. 검사·서버 오류가 있으면 그 오류를 돌려준다 (창이 첫 오류 칸에 초점) */
  const handleSubmit = useCallback(async (): Promise<DdayFormErrors> => {
    if (isSubmitting) return {};
    const validationErrors = validateDdayForm(values);
    setErrors(validationErrors);
    setFormError(null);
    if (Object.values(validationErrors).some(Boolean)) return validationErrors;

    setIsSubmitting(true);
    try {
      if (target.mode === 'edit') {
        const patch = toDdayUpdateRequest(target.dday, values);
        onSaved?.(Object.keys(patch).length > 0 ? await ddayApi.update(target.dday.id, patch) : target.dday);
      } else {
        onSaved?.(await ddayApi.create(toDdayCreateRequest(values)));
      }
      return {};
    } catch (error) {
      const next = toFormErrors(error, DDAY_API_FIELD_TO_FORM_FIELD);
      setErrors(next.errors);
      setFormError(next.formError);
      return next.errors;
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, onSaved, target, values]);

  const requestDelete = useCallback(() => setIsDeleteConfirming(true), []);
  const cancelDelete = useCallback(() => setIsDeleteConfirming(false), []);

  const confirmDelete = useCallback(async () => {
    if (target.mode !== 'edit' || isSubmitting) return;
    setIsDeleteConfirming(false);
    setIsSubmitting(true);
    setFormError(null);
    try {
      await ddayApi.remove(target.dday.id);
      onDeleted?.(target.dday.id);
    } catch (error) {
      setFormError(isApiError(error) ? error.message : '삭제하지 못했어요. 잠시 후 다시 시도하세요.');
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, onDeleted, target]);

  return {
    values,
    errors,
    formError,
    isEdit,
    isDirty,
    isSubmitting,
    isDeleteConfirming,
    update,
    setCountType,
    handleSubmit,
    requestDelete,
    cancelDelete,
    confirmDelete,
  };
};

export type DdayForm = ReturnType<typeof useDdayForm>;
