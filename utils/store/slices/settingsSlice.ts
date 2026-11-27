import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import type { Settings, SettingsUpdateRequest } from '@/types/api';

import { settingsApi, toErrorMessage } from '@utils/api';
import { allowWrite } from '@utils/api/demo/demoBackend';

import { showNotice } from './noticeSlice';

/**
 * 설정 (08 §9 `/settings`, D-024·029). 사이드바 순서·표시·열림(US-19~21)과 달력 설정(US-26)이 같이 쓴다.
 * 바꾸면 화면에 먼저 반영하고 바뀐 항목만 PATCH, 실패하면 그 항목만 되돌린다 (SET-05).
 */

/** 서버 기본값과 같다 (08 §9 표) */
export const DEFAULT_SETTINGS: Settings = {
  weekStartDay: 'SUN',
  startView: 'MONTH',
  timeFormat: '24H',
  slotMinutes: 60,
  darkMode: false,
  colorTheme: 'GREEN',
  sidebarOpen: true,
  sidebarItems: [
    { type: 'TODO', visible: true },
    { type: 'DDAY', visible: true },
    { type: 'DIARY', visible: true },
    { type: 'MEMO', visible: true },
  ],
};

export const SETTINGS_SAVE_FAILED = '설정을 저장하지 못해 이전 값으로 되돌렸어요. 다시 바꿔 주세요.';

interface SettingsState {
  value: Settings;
  status: 'idle' | 'loading' | 'loaded' | 'failed';
}

const initialState: SettingsState = { value: DEFAULT_SETTINGS, status: 'idle' };

type SettingsKey = keyof Settings;
const keysOf = (patch: SettingsUpdateRequest) => Object.keys(patch) as SettingsKey[];
const pick = (settings: Settings, keys: SettingsKey[]): SettingsUpdateRequest =>
  Object.fromEntries(keys.map((key) => [key, settings[key]])) as SettingsUpdateRequest;

export const fetchSettings = createAsyncThunk<Settings, void, { rejectValue: string }>(
  'settings/fetch',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      return await settingsApi.get();
    } catch (error) {
      const message = toErrorMessage(error);
      dispatch(showNotice(message, 'error'));
      return rejectWithValue(message);
    }
  }
);

export type SaveResult = 'saved' | 'failed' | 'blocked';

type ThunkApi = { state: { settings: SettingsState } };

/** 먼저 화면에 반영 → PATCH(바뀐 항목만). 실패하면 그사이 다시 바뀌지 않은 항목만 이전 값으로 (마지막 값이 이김) */
const runSave = async (
  patch: SettingsUpdateRequest,
  { dispatch, getState }: { dispatch: (action: unknown) => unknown; getState: () => { settings: SettingsState } }
): Promise<SaveResult> => {
  if (!allowWrite()) return 'blocked';
  const keys = keysOf(patch);
  const before = pick(getState().settings.value, keys);
  dispatch(applySettings(patch));
  try {
    await settingsApi.update(patch);
    return 'saved';
  } catch {
    const now = getState().settings.value;
    const untouched = keys.filter((key) => JSON.stringify(now[key]) === JSON.stringify(patch[key]));
    if (untouched.length > 0) dispatch(applySettings(pick({ ...now, ...before } as Settings, untouched)));
    return 'failed';
  }
};

/** 설정 바꾸기 (사이드바 등): 실패하면 알림으로 안내. 둘러보기는 막힘 안내만 (D-093) */
export const saveSettings = createAsyncThunk<void, SettingsUpdateRequest, ThunkApi>('settings/save', async (patch, api) => {
  const result = await runSave(patch, api);
  if (result === 'failed') api.dispatch(showNotice(SETTINGS_SAVE_FAILED, 'error'));
});

/** 달력 설정 패널용: 결과를 돌려주고 알림은 띄우지 않는다 (패널 위 안내 줄이 알린다, #396 v1.3) */
export const saveSettingsQuietly = createAsyncThunk<SaveResult, SettingsUpdateRequest, ThunkApi>('settings/saveQuietly', (patch, api) =>
  runSave(patch, api)
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    applySettings(state, action: PayloadAction<SettingsUpdateRequest>) {
      state.value = { ...state.value, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.status = 'loaded';
        state.value = { ...DEFAULT_SETTINGS, ...action.payload };
      })
      .addCase(fetchSettings.rejected, (state) => {
        state.status = 'failed';
      });
  },
});

export const { applySettings } = settingsSlice.actions;

export const selectSettings = (state: { settings: SettingsState }) => state.settings.value;
export const selectSidebarItems = (state: { settings: SettingsState }) => state.settings.value.sidebarItems;
export const selectSidebarOpenSetting = (state: { settings: SettingsState }) => state.settings.value.sidebarOpen;

export default settingsSlice.reducer;
