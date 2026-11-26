import apiClient from '../client';
import type { Settings, SettingsUpdateRequest } from '@/types/api';

/** 설정 `/settings` (08-api-design 9절, D-024·029). 하나뿐이라 id가 없다 */
export const settingsApi = {
  get: () => apiClient.get<Settings>('/settings'),

  /** 바뀐 항목만 보내 바로 저장 (SET-05). sidebarItems는 4개 전체를 순서대로 */
  update: (body: SettingsUpdateRequest) => apiClient.patch<Settings>('/settings', body),
};
