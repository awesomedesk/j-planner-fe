"use client";

import { useCallback } from 'react';

import { useAppDispatch } from '@/app/hooks';
import { showNotice } from '@store/slices/noticeSlice';
import { logger } from '@env/config';

import { toErrorMessage } from '@utils/api';
import { isDemoBlocked } from '@utils/api/demo/demoBackend';

/**
 * 오류를 짧은 안내로 띄우는 함수를 돌려준다 (US-03)
 * 둘러보기에서 막은 저장(DEMO_READ_ONLY)은 요청을 보내지 않은 정상 경계라 콘솔 오류·안내 없이 넘긴다 (US-40, #351) —
 * '가입하면 저장돼요' 창이 대신 알린다. 그 밖의 오류는 그대로 남긴다
 * @example
 * const notifyError = useErrorNotice();
 * try { await categoryApi.getList(); } catch (e) { notifyError(e); }
 */
export const useErrorNotice = () => {
  const dispatch = useAppDispatch();

  return useCallback(
    (error: unknown) => {
      if (isDemoBlocked(error)) return;
      logger.error('Request failed', error);
      dispatch(showNotice(toErrorMessage(error), 'error'));
    },
    [dispatch]
  );
};
