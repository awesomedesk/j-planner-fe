"use client";

import { useCallback, useMemo, useState } from 'react';

import type { Id, LocalDate, Schedule } from '@/types/api';

import { isApiError, scheduleApi } from '@utils/api';
import {
  API_FIELD_TO_FORM_FIELD,
  createEmptyFormValues,
  scheduleToFormValues,
  shiftEndWithStart,
  toCreateRequest,
  toUpdateRequest,
  validateScheduleForm,
  type ScheduleFormErrors,
  type ScheduleFormField,
  type ScheduleFormValues,
} from '../utils/scheduleFormUtils';

export type ScheduleFormTarget =
  | { mode: 'create'; baseDate: LocalDate; startTime?: string }
  | { mode: 'edit'; schedule: Schedule };

export interface UseScheduleFormOptions {
  target: ScheduleFormTarget;
  /** 저장 성공 (추가·수정) */
  onSaved?: (schedule: Schedule) => void;
  /** 삭제 성공 */
  onDeleted?: (id: Id) => void;
}

/**
 * 일정 입력 창(OV-01, MO-08)의 상태·저장·삭제
 *
 * - 저장 전에 FE에서 먼저 검사하고, 서버 오류(VALIDATION_FAILED)도 칸별로 보여준다.
 * - 수정은 바뀐 필드만 PATCH. 바뀐 것이 없으면 요청 없이 닫는다.
 */
export const useScheduleForm = ({ target, onSaved, onDeleted }: UseScheduleFormOptions) => {
  // 1. State
  const [values, setValues] = useState<ScheduleFormValues>(() =>
    target.mode === 'edit'
      ? scheduleToFormValues(target.schedule)
      : createEmptyFormValues(target.baseDate, target.startTime)
  );
  const [errors, setErrors] = useState<ScheduleFormErrors>({});
  /** 칸에 속하지 않는 오류 (네트워크, 404 등) */
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);

  const isEdit = target.mode === 'edit';

  // 2. Handlers
  const setField = useCallback(<K extends ScheduleFormField>(field: K, value: ScheduleFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }, []);

  /** 시작 날짜·시간을 바꾸면 종료도 같은 길이만큼 옮긴다 */
  const setStart = useCallback((startDate: LocalDate, startTime: string) => {
    setValues((prev) => ({ ...prev, startDate, startTime, ...shiftEndWithStart(prev, startDate, startTime) }));
    setErrors((prev) => ({ ...prev, startDate: undefined, startTime: undefined, endDate: undefined, endTime: undefined }));
  }, []);

  const applyServerError = useCallback((error: unknown) => {
    if (!isApiError(error)) {
      setFormError('저장하지 못했어요. 잠시 후 다시 시도하세요.');
      return;
    }
    if (error.code === 'VALIDATION_FAILED' && error.errors.length > 0) {
      const next: ScheduleFormErrors = {};
      const unknownMessages: string[] = [];
      error.errors.forEach(({ field, message }) => {
        const formField = API_FIELD_TO_FORM_FIELD[field] ?? API_FIELD_TO_FORM_FIELD[field.split('.')[0]];
        if (formField) next[formField] = message;
        else unknownMessages.push(message);
      });
      setErrors(next);
      setFormError(unknownMessages.length > 0 ? unknownMessages.join('\n') : null);
      return;
    }
    setFormError(error.message);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    const validationErrors = validateScheduleForm(values);
    setErrors(validationErrors);
    setFormError(null);
    if (Object.values(validationErrors).some(Boolean)) return;

    setIsSubmitting(true);
    try {
      if (target.mode === 'edit') {
        const patch = toUpdateRequest(target.schedule, values);
        const saved =
          Object.keys(patch).length > 0 ? await scheduleApi.update(target.schedule.id, patch) : target.schedule;
        onSaved?.(saved);
      } else {
        const saved = await scheduleApi.create(toCreateRequest(values));
        onSaved?.(saved);
      }
    } catch (error) {
      applyServerError(error);
    } finally {
      setIsSubmitting(false);
    }
  }, [applyServerError, isSubmitting, onSaved, target, values]);

  /** 삭제는 두 번 눌러 확인한다 (삭제 → 삭제 확인) */
  const handleDelete = useCallback(async () => {
    if (target.mode !== 'edit' || isSubmitting) return;
    if (!isDeleteConfirming) {
      setIsDeleteConfirming(true);
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    try {
      await scheduleApi.remove(target.schedule.id);
      onDeleted?.(target.schedule.id);
    } catch (error) {
      setFormError(isApiError(error) ? error.message : '삭제하지 못했어요. 잠시 후 다시 시도하세요.');
      setIsDeleteConfirming(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [isDeleteConfirming, isSubmitting, onDeleted, target]);

  const cancelDeleteConfirm = useCallback(() => setIsDeleteConfirming(false), []);

  // 3. Return
  return useMemo(
    () => ({
      values,
      errors,
      formError,
      isEdit,
      isSubmitting,
      isDeleteConfirming,
      setField,
      setStart,
      handleSubmit,
      handleDelete,
      cancelDeleteConfirm,
    }),
    [values, errors, formError, isEdit, isSubmitting, isDeleteConfirming, setField, setStart, handleSubmit, handleDelete, cancelDeleteConfirm]
  );
};
