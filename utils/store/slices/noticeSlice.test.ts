import { describe, expect, it } from 'vitest';

import { makeStore } from '@store/store';

import { dismissNotice, selectNotices, showNotice } from './noticeSlice';

describe('짧은 안내 (US-03)', () => {
  it('같은 문구는 한 번만 뜬다', () => {
    const store = makeStore();
    store.dispatch(showNotice('서버에 연결할 수 없어요.'));
    store.dispatch(showNotice('서버에 연결할 수 없어요.'));
    expect(selectNotices(store.getState())).toHaveLength(1);
  });

  it('최대 3개, 넘으면 오래된 것부터 사라진다', () => {
    const store = makeStore();
    ['a', 'b', 'c', 'd'].forEach((m) => store.dispatch(showNotice(m)));
    expect(selectNotices(store.getState()).map((n) => n.message)).toEqual(['b', 'c', 'd']);
  });

  it('닫기', () => {
    const store = makeStore();
    store.dispatch(showNotice('a'));
    const [notice] = selectNotices(store.getState());
    store.dispatch(dismissNotice(notice.id));
    expect(selectNotices(store.getState())).toHaveLength(0);
  });
});
