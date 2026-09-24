"use client";

import { useEffect } from 'react';

import { useAppDispatch } from '@/app/hooks';
import { showNotice } from '@store/slices/noticeSlice';
import { logger } from '@env/config';

import { isApiError, systemApi } from '@utils/api';

/** 서버에 닿지 않을 때 안내 */
export const SERVER_UNREACHABLE_MESSAGE = '서버에 연결할 수 없어요. 잠시 후 다시 시도하세요.';

/**
 * ServerStatusCheck - 앱을 열 때 서버 상태를 한 번 확인한다 (US-03)
 * 연결이 안 되면 짧은 안내만 띄우고 화면은 그대로 쓴다.
 */
export default function ServerStatusCheck() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    systemApi
      .checkHealth()
      .then(() => logger.info('Server status: OK'))
      .catch((error) => {
        logger.warn('Server status check failed', isApiError(error) ? { status: error.status, code: error.code } : error);
        dispatch(showNotice(SERVER_UNREACHABLE_MESSAGE, 'error'));
      });
  }, [dispatch]);

  return null;
}
