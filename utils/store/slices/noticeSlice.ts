import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/**
 * 화면 아래에 잠깐 뜨는 짧은 안내 (US-03)
 * API 오류·네트워크 오류 등을 화면이 깨지지 않게 알려 준다.
 */
export type NoticeTone = 'error' | 'info';

export interface Notice {
  id: number;
  message: string;
  tone: NoticeTone;
}

interface NoticeState {
  items: Notice[];
}

/** 한 번에 보이는 안내 수. 넘으면 오래된 것부터 지운다 */
const MAX_NOTICES = 3;

let nextNoticeId = 1;

const noticeSlice = createSlice({
  name: 'notice',
  initialState: { items: [] } as NoticeState,
  reducers: {
    showNotice: {
      reducer(state, action: PayloadAction<Notice>) {
        // 같은 문구가 이미 떠 있으면 다시 띄우지 않는다 (연속 실패 시 안내가 쌓이지 않게)
        if (state.items.some((n) => n.message === action.payload.message)) return;
        state.items.push(action.payload);
        if (state.items.length > MAX_NOTICES) state.items.shift();
      },
      prepare(message: string, tone: NoticeTone = 'error') {
        return { payload: { id: nextNoticeId++, message, tone } };
      },
    },
    dismissNotice(state, action: PayloadAction<number>) {
      state.items = state.items.filter((n) => n.id !== action.payload);
    },
  },
});

export const { showNotice, dismissNotice } = noticeSlice.actions;
export const selectNotices = (state: { notice: NoticeState }) => state.notice.items;

export default noticeSlice.reducer;
