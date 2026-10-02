import { isApiError } from '@utils/api';

/**
 * 저장 실패 → 칸별 오류 + 칸에 속하지 않는 오류 (일정·Todo 입력 창 공통)
 * VALIDATION_FAILED의 errors[].field(API 필드)를 fieldMap으로 폼 칸에 옮긴다. 'time.start'처럼 하위 필드면 앞부분으로도 찾는다
 */
export const toFormErrors = <F extends string>(error: unknown, fieldMap: Record<string, F>, fallback = '저장하지 못했어요. 잠시 후 다시 시도하세요.') => {
  if (!isApiError(error)) return { errors: {} as Partial<Record<F, string>>, formError: fallback };
  if (error.code === 'VALIDATION_FAILED' && error.errors.length > 0) {
    const errors: Partial<Record<F, string>> = {};
    const unknownMessages: string[] = [];
    error.errors.forEach(({ field, message }) => {
      const formField = fieldMap[field] ?? fieldMap[field.split('.')[0]];
      if (formField) errors[formField] = message;
      else unknownMessages.push(message);
    });
    return { errors, formError: unknownMessages.length > 0 ? unknownMessages.join('\n') : null };
  }
  return { errors: {} as Partial<Record<F, string>>, formError: error.message };
};
