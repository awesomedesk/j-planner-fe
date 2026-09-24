"use client";

import { useCallback } from 'react';

import { useAppDispatch } from '@/app/hooks';
import { showNotice } from '@store/slices/noticeSlice';
import { logger } from '@env/config';

import { toErrorMessage } from '@utils/api';

/**
 * 오류를 짧은 안내로 띄우는 함수를 돌려준다 (US-03)
 * @example
 * const notifyError = useErrorNotice();
 * try { await categoryApi.getList(); } catch (e) { notifyError(e); }
 */
export const useErrorNotice = () => {
  const dispatch = useAppDispatch();

  return useCallback(
    (error: unknown) => {
      logger.error('Request failed', error);
      dispatch(showNotice(toErrorMessage(error), 'error'));
    },
    [dispatch]
  );
};
