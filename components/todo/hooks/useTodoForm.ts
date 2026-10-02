"use client";

import { useCallback, useMemo, useState } from 'react';

import type { Id, LocalDate, Todo, TodoType } from '@/types/api';
import { toFormErrors } from '@components/form/serverErrors';

import { isApiError, todoApi } from '@utils/api';
import { DEFAULT_WEEK_START, type WeekStartDay } from '@utils/date/dateUtils';

import {
  TODO_API_FIELD_TO_FORM_FIELD,
  changeTodoType,
  createEmptyTodoValues,
  isTodoFormChanged,
  setTodoDate,
  todoToFormValues,
  toTodoCreateRequest,
  toTodoUpdateRequest,
  validateTodoForm,
  type TodoFormErrors,
  type TodoFormField,
  type TodoFormValues,
} from '../utils/todoFormUtils';

export type TodoFormTarget = { mode: 'create'; baseDate: LocalDate } | { mode: 'edit'; todo: Todo };

interface UseTodoFormOptions {
  target: TodoFormTarget;
  /** 주간 목표의 주 시작 요일. 설정 연결은 US-26 (그 전에는 기본 일요일) */
  weekStart?: WeekStartDay;
  onSaved?: (todo: Todo) => void;
  onDeleted?: (id: Id) => void;
}

/**
 * Todo 입력 창(OV-02, MO-09)의 상태·저장·삭제 (US-12)
 * 일정 입력 창(useScheduleForm)과 같은 흐름: FE 검사 → 저장, 서버 오류는 칸별로. 수정은 바뀐 필드만 PATCH
 */
export const useTodoForm = ({ target, weekStart = DEFAULT_WEEK_START, onSaved, onDeleted }: UseTodoFormOptions) => {
  const [initialValues] = useState<TodoFormValues>(() =>
    target.mode === 'edit' ? todoToFormValues(target.todo) : createEmptyTodoValues(target.baseDate)
  );
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<TodoFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false);

  const isEdit = target.mode === 'edit';
  const isDirty = useMemo(() => isTodoFormChanged(initialValues, values), [initialValues, values]);

  const setField = useCallback(<K extends TodoFormField>(field: K, value: TodoFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }, []);

  const clearDateErrors = () => setErrors((prev) => ({ ...prev, startDate: undefined, endDate: undefined }));

  const setType = useCallback(
    (type: TodoType) => {
      setValues((prev) => changeTodoType(prev, type, weekStart));
      clearDateErrors();
    },
    [weekStart]
  );

  const setDate = useCallback(
    (date: string) => {
      if (!date) return;
      setValues((prev) => setTodoDate(prev, date, weekStart));
      clearDateErrors();
    },
    [weekStart]
  );

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    const validationErrors = validateTodoForm(values);
    setErrors(validationErrors);
    setFormError(null);
    if (Object.values(validationErrors).some(Boolean)) return;

    setIsSubmitting(true);
    try {
      if (target.mode === 'edit') {
        const patch = toTodoUpdateRequest(target.todo, values);
        onSaved?.(Object.keys(patch).length > 0 ? await todoApi.update(target.todo.id, patch) : target.todo);
      } else {
        onSaved?.(await todoApi.create(toTodoCreateRequest(values)));
      }
    } catch (error) {
      const next = toFormErrors(error, TODO_API_FIELD_TO_FORM_FIELD);
      setErrors(next.errors);
      setFormError(next.formError);
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, onSaved, target, values]);

  /** 삭제는 두 번 눌러 확인 (일정과 같게) */
  const handleDelete = useCallback(async () => {
    if (target.mode !== 'edit' || isSubmitting) return;
    if (!isDeleteConfirming) {
      setIsDeleteConfirming(true);
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    try {
      await todoApi.remove(target.todo.id);
      onDeleted?.(target.todo.id);
    } catch (error) {
      setFormError(isApiError(error) ? error.message : '삭제하지 못했어요. 잠시 후 다시 시도하세요.');
      setIsDeleteConfirming(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [isDeleteConfirming, isSubmitting, onDeleted, target]);

  const cancelDeleteConfirm = useCallback(() => setIsDeleteConfirming(false), []);

  return {
    values,
    errors,
    formError,
    isEdit,
    isDirty,
    isSubmitting,
    isDeleteConfirming,
    setField,
    setType,
    setDate,
    handleSubmit,
    handleDelete,
    cancelDeleteConfirm,
  };
};

export type TodoForm = ReturnType<typeof useTodoForm>;
