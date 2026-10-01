import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CATEGORIES } from '@/test/fixtures';
import { json, mockApi } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import { SEED_SCHEDULES } from '@/test/seed';
import { setViewportWidth } from '@/test/viewport';
import { setCategoryFilter, setViewMode } from '@store/slices/calendarSlice';
import { fetchCategories } from '@store/slices/categorySlice';
import { makeStore } from '@store/store';

import AppShell from './AppShell';

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 8, 25, 10, 0));
});
afterEach(() => vi.useRealTimers());

const setup = async (width: number) => {
  setViewportWidth(width);
  const api = mockApi({
    'GET /schedules': () => json(200, SEED_SCHEDULES),
    'GET /categories': () => json(200, CATEGORIES),
    'POST /schedules': (req) => json(201, { id: 90, ...(req.body as object) }),
  });
  const store = makeStore();
  await store.dispatch(fetchCategories());
  return { api, ...renderWithStore(<AppShell />, { store }) };
};

// jsdom은 Tailwind 클래스를 적용하지 않으므로 (hidden tablet:flex) 폭별 차이는 JS로 갈리는 부분만 확인한다.
describe('화면 틀 (US-01, D-018)', () => {
  it('1440px: 사이드바가 열린 채 시작하고, 달력은 막대', async () => {
    await setup(1440);
    expect(screen.getByRole('complementary', { name: '사이드바' })).toBeInTheDocument();
    const monthly = screen.getByLabelText('월간 달력');
    expect(await within(monthly).findByRole('button', { name: /치과/ })).toBeInTheDocument();
    expect(within(monthly).queryByRole('button', { name: /일정 \d+개/ })).not.toBeInTheDocument(); // 색 점 아님
  });

  it('820px: 사이드바는 닫힌 막대로 시작, 열면 열린다', async () => {
    const { user } = await setup(820);
    const closed = screen.getByRole('complementary', { name: '사이드바 (닫힘)' });
    await user.click(within(closed).getAllByRole('button')[0]);
    expect(screen.getByRole('complementary', { name: '사이드바' })).toBeInTheDocument();
  });

  it('390px: 달력은 색 점, 날짜를 누르면 아래 날짜 시트 (MO-01)', async () => {
    const { user } = await setup(390);
    await user.click(await screen.findByRole('button', { name: '9월 25일 (금), 일정 4개' }));
    const sheet = screen.getByRole('region', { name: '9월 25일 (금) 날짜 시트' });
    expect(within(sheet).getByText('치과')).toBeInTheDocument();
    await user.click(within(sheet).getByRole('button', { name: '시트 닫기' }));
    expect(screen.queryByRole('region', { name: /날짜 시트/ })).not.toBeInTheDocument();
  });
});

describe('추가 → 일정 입력 (US-05, D-015)', () => {
  it('고른 날짜를 기준으로 일정 추가 창이 열린다', async () => {
    const { user } = await setup(1440);
    await user.click(screen.getByRole('button', { name: '9월 23일 (수)' }));
    await user.click(screen.getAllByRole('button', { name: '추가' })[0]); // PC 헤더 (jsdom은 모바일 + 버튼도 그림)
    await user.click(screen.getByRole('menuitem', { name: '일정' }));
    const dialog = screen.getByRole('dialog', { name: '일정 추가' });
    expect(within(dialog).getByLabelText('시작 날짜')).toHaveValue('2026-09-23');
  });

  it('일정 막대를 누르면 수정 창', async () => {
    const { user } = await setup(1440);
    await user.click(await screen.findByRole('button', { name: /팀 주간 회의/ }));
    expect(screen.getByRole('dialog', { name: '일정 수정' })).toBeInTheDocument();
    expect(screen.getByLabelText('제목')).toHaveValue('팀 주간 회의');
  });
});

describe('보기 전환 (PC-01, US-07)', () => {
  it('주를 누르면 주간 시간표, 헤더 제목은 그 주 기간', async () => {
    const { user, store } = await setup(1440);
    expect(screen.getAllByRole('heading', { name: '2026년 9월' }).length).toBeGreaterThan(0);
    const group = screen.getByRole('group', { name: '보기 전환' });
    await user.click(within(group).getByRole('button', { name: '주' }));
    expect(store.getState().calendar.viewMode).toBe('WEEK');
    expect(within(group).getByRole('button', { name: '주' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByLabelText('주간 시간표')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: '9월 20일 – 26일' }).length).toBeGreaterThan(0);
  });

  it('일을 누르면 일간 시간표, 헤더 제목은 그날 (US-08)', async () => {
    const { user } = await setup(1440);
    await user.click(screen.getByRole('button', { name: '9월 23일 (수)' }));
    await user.click(within(screen.getByRole('group', { name: '보기 전환' })).getByRole('button', { name: '일' }));
    expect(screen.getByLabelText('일간 시간표')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: '9월 23일 (수)' }).length).toBeGreaterThan(0);
  });

  it('주간에서 보던 시간은 일간으로 바꿔도 그대로 (D-046 ②)', async () => {
    const { user } = await setup(1440);
    const views = within(screen.getByRole('group', { name: '보기 전환' }));
    await user.click(views.getByRole('button', { name: '주' }));
    const weekScroll = screen.getByTestId('timetable-scroll');
    weekScroll.scrollTop = 8 * 46; // 08:00
    fireEvent.scroll(weekScroll);
    await user.click(views.getByRole('button', { name: '일' }));
    expect(screen.getByTestId('timetable-scroll').scrollTop).toBe(8 * 48);
  });

  it('월간에서 고른 날짜의 주로 간다', async () => {
    const { user } = await setup(1440);
    await user.click(screen.getByRole('button', { name: '9월 30일 (수)' }));
    await user.click(within(screen.getByRole('group', { name: '보기 전환' })).getByRole('button', { name: '주' }));
    expect(screen.getAllByRole('heading', { name: '9월 27일 – 10월 3일' }).length).toBeGreaterThan(0);
  });

  it('주간 블록을 누르면 일정 수정 창', async () => {
    const { user } = await setup(1440);
    await user.click(within(screen.getByRole('group', { name: '보기 전환' })).getByRole('button', { name: '주' }));
    await user.click(await within(screen.getByLabelText('주간 시간표')).findByRole('button', { name: /치과/ }));
    expect(screen.getByRole('dialog', { name: '일정 수정' })).toBeInTheDocument();
  });

  it('390px에서 주간으로 바로 열어도 처음 위치는 모바일 크기(1시간 38px) 기준 (D-046, US-07 검수)', async () => {
    vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(600);
    setViewportWidth(390);
    mockApi({ 'GET /schedules': () => json(200, SEED_SCHEDULES), 'GET /categories': () => json(200, CATEGORIES) });
    const store = makeStore();
    store.dispatch(setViewMode('WEEK')); // 처음 화면이 주간 (설정 '처음 화면' US-27)
    renderWithStore(<AppShell />, { store });
    // 10:00 고정 시각 → 8(위 여백) + 10 × 38 − 600/2
    expect(screen.getByTestId('timetable-scroll').scrollTop).toBe(8 + 10 * 38 - 300);
    vi.restoreAllMocks();
  });

  it('390px 주간은 모바일 7칸 시간표 (MO-05)', async () => {
    const { store } = await setup(390);
    act(() => { store.dispatch(setViewMode('WEEK')); });
    const weekly = screen.getByLabelText('주간 시간표');
    expect(within(weekly).getByText('0')).toBeInTheDocument(); // 모바일 눈금은 시만
    expect(screen.getByRole('button', { name: '화면 선택' })).toHaveTextContent('주간'); // 지금 보기 (D-022)
  });
});

describe('날짜 이동 — PC·태블릿 헤더 ‹ › · 오늘 (US-09)', () => {
  const header = () => screen.getByRole('banner', { name: '달력 도구' });
  const title = () => within(header()).getByRole('heading').textContent;
  const click = async (user: ReturnType<typeof renderWithStore>['user'], name: string) =>
    user.click(within(header()).getByRole('button', { name }));

  it('월간: 한 달씩, 오늘로 돌아오기', async () => {
    const { user } = await setup(1440);
    await click(user, '다음');
    expect(title()).toBe('2026년 10월');
    await click(user, '이전');
    await click(user, '이전');
    expect(title()).toBe('2026년 8월');
    await click(user, '오늘');
    expect(title()).toBe('2026년 9월');
    expect(screen.getByRole('button', { name: '9월 25일 (금)' })).toHaveAttribute('aria-current', 'date');
  });

  it('주간은 한 주, 일간은 하루', async () => {
    const { user } = await setup(1440);
    const views = within(screen.getByRole('group', { name: '보기 전환' }));
    await user.click(views.getByRole('button', { name: '주' }));
    await click(user, '다음');
    expect(title()).toBe('9월 27일 – 10월 3일');
    await user.click(views.getByRole('button', { name: '일' }));
    expect(title()).toBe('10월 2일 (금)');
    await click(user, '이전');
    expect(title()).toBe('10월 1일 (목)');
  });

  it('옮기면 사이드바 날짜(고른 날짜)도 같이 간다', async () => {
    const { user } = await setup(1440);
    await click(user, '다음');
    expect(within(screen.getByRole('complementary', { name: '사이드바' })).getByRole('heading', { name: '10월 25일 (일)' })).toBeInTheDocument();
  });

  it("태블릿(820px)에도 '오늘' 버튼 (D-037)", async () => {
    await setup(820);
    expect(within(header()).getByRole('button', { name: '오늘' })).not.toHaveClass('hidden');
  });
});

describe('날짜 이동 — 모바일 (US-09, D-022·D-025)', () => {
  const swipe = (el: HTMLElement, dx: number) => {
    fireEvent.touchStart(el, { touches: [{ clientX: 200, clientY: 300 }] });
    fireEvent.touchEnd(el, { changedTouches: [{ clientX: 200 + dx, clientY: 300 }] });
  };
  const mobileTitle = () => within(screen.getByRole('banner', { name: '모바일 머리' })).getByRole('heading').textContent;

  it('화면 선택: 월간/주간/3일/일간/목록, 3일·목록은 아직 막힘 (US-29)', async () => {
    const { user, store } = await setup(390);
    await user.click(screen.getByRole('button', { name: '화면 선택' }));
    const list = screen.getByRole('listbox', { name: '화면 선택' });
    expect(within(list).getAllByRole('option').map((o) => o.textContent)).toEqual(['월간', '주간', '3일', '일간', '목록']);
    expect(within(list).getByRole('option', { name: '3일' })).toHaveAttribute('aria-disabled', 'true');
    expect(within(list).getByRole('option', { name: '월간' })).toHaveAttribute('aria-selected', 'true');
    await user.click(within(list).getByRole('option', { name: '주간' }));
    expect(store.getState().calendar.viewMode).toBe('WEEK');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('달력을 왼쪽으로 밀면 다음 달, 오른쪽으로 밀면 이전 달', async () => {
    await setup(390);
    swipe(screen.getByRole('main'), -120);
    expect(mobileTitle()).toBe('2026년 10월');
    swipe(screen.getByRole('main'), 120);
    swipe(screen.getByRole('main'), 120);
    expect(mobileTitle()).toBe('2026년 8월');
  });

  it('주간은 한 주, 일간은 하루씩 밀린다', async () => {
    const { store } = await setup(390);
    act(() => { store.dispatch(setViewMode('WEEK')); });
    swipe(screen.getByRole('main'), -120);
    expect(mobileTitle()).toBe('9월 27일 – 10월 3일');
    act(() => { store.dispatch(setViewMode('DAY')); });
    swipe(screen.getByRole('main'), 120);
    expect(mobileTitle()).toBe('10월 1일 (목)');
  });

  it("화면 선택 줄의 '오늘'로 돌아온다 (D-048: 하나만)", async () => {
    const { user } = await setup(390);
    swipe(screen.getByRole('main'), -120);
    const todayButtons = screen.getAllByRole('button', { name: '오늘' }).filter((b) => b.closest('[aria-label="모바일 머리"]'));
    expect(todayButtons).toHaveLength(1);
    await user.click(todayButtons[0]);
    expect(mobileTitle()).toBe('2026년 9월');
  });

  it('날짜 시트가 열려 있으면 넘길 때 닫는다', async () => {
    const { user } = await setup(390);
    await user.click(await screen.findByRole('button', { name: '9월 25일 (금), 일정 4개' }));
    expect(screen.getByRole('region', { name: /날짜 시트/ })).toBeInTheDocument();
    swipe(screen.getByRole('main'), -120);
    expect(screen.queryByRole('region', { name: /날짜 시트/ })).not.toBeInTheDocument();
  });
});

describe('빈 시간 눌러 빠른 추가 (US-10)', () => {
  // jsdom은 칸 위치가 모두 0이라 clientY가 곧 시간표 맨 위에서 잰 거리
  const openQuickAdd = async (width: number, mode: 'WEEK' | 'DAY', label: string, clientY: number) => {
    const view = await setup(width);
    act(() => {
      view.store.dispatch(setViewMode(mode));
    });
    fireEvent.click(await screen.findByRole('group', { name: `${label} 시간표` }), { clientY });
    return view;
  };

  it('PC 주간: 팝업 + 점선 임시 블록, 제목을 쓰면 블록 글자도 바뀐다 (D-017·D-021)', async () => {
    const { user } = await openQuickAdd(1440, 'WEEK', '9월 24일 (목)', 14 * 46 + 10);
    const popup = screen.getByRole('dialog', { name: '빠른 추가' });
    expect(popup).toHaveAttribute('data-variant', 'popover');
    const column = screen.getByRole('group', { name: '9월 24일 (목) 시간표' });
    expect(within(column).getByTestId('draft-block')).toHaveTextContent('(제목 없음) · 14:00-15:00');
    await user.type(within(popup).getByRole('textbox', { name: '제목' }), '팀 미팅');
    expect(within(column).getByTestId('draft-block')).toHaveTextContent('팀 미팅 · 14:00-15:00');
  });

  it('저장하면 실제 일정으로: POST 후 다시 불러오고 팝업·임시 블록은 사라진다', async () => {
    const { user, api } = await openQuickAdd(1440, 'WEEK', '9월 24일 (목)', 14 * 46 + 10);
    const before = api.calls('GET /schedules').length;
    await user.type(screen.getByRole('textbox', { name: '제목' }), '팀 미팅{Enter}');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: '빠른 추가' })).not.toBeInTheDocument());
    expect(api.calls('POST /schedules')[0].body).toMatchObject({ title: '팀 미팅', start: '2026-09-24T14:00:00', end: '2026-09-24T15:00:00' });
    await waitFor(() => expect(api.calls('GET /schedules').length).toBeGreaterThan(before));
    expect(screen.queryByTestId('draft-block')).not.toBeInTheDocument();
  });

  it('취소하면 팝업과 임시 블록이 함께 사라진다', async () => {
    const { user } = await openQuickAdd(1440, 'DAY', '9월 25일 (금)', 9 * 48 + 5);
    expect(screen.getByTestId('draft-block')).toHaveTextContent('(제목 없음) · 09:00-10:00');
    await user.click(screen.getByRole('button', { name: '취소' }));
    expect(screen.queryByRole('dialog', { name: '빠른 추가' })).not.toBeInTheDocument();
    expect(screen.queryByTestId('draft-block')).not.toBeInTheDocument();
  });

  it('자세히 입력 → 일정 추가 창에 제목·날짜·시간이 이어진다', async () => {
    const { user } = await openQuickAdd(1440, 'DAY', '9월 25일 (금)', 9 * 48 + 5);
    await user.type(screen.getByRole('textbox', { name: '제목' }), '치과 예약');
    await user.click(screen.getByRole('button', { name: '자세히 입력' }));
    expect(screen.queryByRole('dialog', { name: '빠른 추가' })).not.toBeInTheDocument();
    const full = screen.getByRole('dialog', { name: '일정 추가' });
    expect(within(full).getByRole('textbox', { name: '제목' })).toHaveValue('치과 예약');
    expect(within(full).getByLabelText('시작 날짜')).toHaveValue('2026-09-25');
    expect(within(full).getByLabelText('시작 시간')).toHaveValue('09:00');
    expect(within(full).getByLabelText('종료 시간')).toHaveValue('10:00');
  });

  it('390px 일간: 아래 시트로 열린다 (MO-12, 취소 버튼 없음)', async () => {
    await openQuickAdd(390, 'DAY', '9월 25일 (금)', 9 * 46 + 5);
    const sheet = screen.getByRole('dialog', { name: '빠른 추가' });
    expect(sheet).toHaveAttribute('data-variant', 'sheet');
    expect(within(sheet).queryByRole('button', { name: '취소' })).not.toBeInTheDocument();
    expect(screen.getByTestId('draft-block')).toBeInTheDocument();
  });

  it('입력한 것이 없으면 바깥을 눌러 바로 닫는다', async () => {
    const { user } = await openQuickAdd(1440, 'DAY', '9월 25일 (금)', 9 * 48 + 5);
    await user.click(screen.getByTestId('quick-add-backdrop'));
    expect(screen.queryByRole('dialog', { name: '빠른 추가' })).not.toBeInTheDocument();
  });
});

describe('카테고리 필터 (US-11)', () => {
  it('PC: 고르면 그 카테고리 일정만 다시 받는다 (월·주·일 같은 자리)', async () => {
    const { user, api, store } = await setup(1440);
    await user.click(screen.getByRole('button', { name: /카테고리 필터/ }));
    await user.click(screen.getByRole('button', { name: '모두 해제' }));
    await user.click(screen.getByRole('checkbox', { name: '업무' }));
    await waitFor(() => expect(api.calls('GET /schedules').at(-1)?.query.getAll('categoryId')).toEqual(['3']));
    // 주간으로 바꿔도 필터는 그대로
    act(() => {
      store.dispatch(setViewMode('WEEK'));
    });
    await waitFor(() => expect(api.calls('GET /schedules').at(-1)?.query.get('from')).toBe('2026-09-20'));
    expect(api.calls('GET /schedules').at(-1)?.query.getAll('categoryId')).toEqual(['3']);
    expect(screen.getAllByRole('button', { name: /카테고리 필터/ })[0]).toHaveTextContent('카테고리: 1개');
  });

  it("PC: 드롭다운 맨 아래 '카테고리 관리' → 관리 창 (D-016)", async () => {
    const { user } = await setup(1440);
    await user.click(screen.getByRole('button', { name: /카테고리 필터/ }));
    await user.click(screen.getByRole('button', { name: '카테고리 관리' }));
    expect(screen.getByRole('dialog', { name: '카테고리 관리' })).toBeInTheDocument();
  });

  it('390px: 아래 시트에서 고르고 적용 (MO-06)', async () => {
    const { user, api } = await setup(390);
    await user.click(screen.getByRole('button', { name: /카테고리 필터/ }));
    const sheet = screen.getByRole('dialog', { name: '카테고리 필터' });
    await user.click(within(sheet).getByRole('checkbox', { name: '운동' }));
    await user.click(within(sheet).getByRole('button', { name: '적용 (3개)' }));
    await waitFor(() => expect(api.calls('GET /schedules').at(-1)?.query.getAll('categoryId')).toEqual(['1', '2', '3']));
  });
});

describe('빠른 추가 조절·옮기기 (D-053)', () => {
  // jsdom은 칸 위치가 모두 0이라 clientY = 시간표 맨 위에서 잰 거리 (일간 PC 1시간 = 48px)
  const openDay = async () => {
    const view = await setup(1440);
    act(() => {
      view.store.dispatch(setViewMode('DAY'));
    });
    const column = await screen.findByRole('group', { name: '9월 25일 (금) 시간표' });
    fireEvent.click(column, { clientY: 9 * 48 + 5 });
    return { ...view, column };
  };

  it('아래 손잡이를 끌면 팝업 종료 시간도 바뀐다', async () => {
    await openDay();
    fireEvent.pointerDown(screen.getByTestId('draft-handle-end'), { clientY: 10 * 48 });
    fireEvent.pointerMove(window, { clientY: 11 * 48 + 30 });
    fireEvent.pointerUp(window, { clientY: 11 * 48 + 30 });
    expect(screen.getByLabelText('종료 시간')).toHaveValue('11:30');
    expect(screen.getByTestId('draft-block')).toHaveTextContent('(제목 없음) · 09:00-11:30');
  });

  it('아무것도 안 쓰고 다른 빈 시간을 누르면 팝업이 새 자리로 (Q7)', async () => {
    const { column } = await openDay();
    fireEvent.click(column, { clientY: 15 * 48 + 40 });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText('시작 시간')).toHaveValue('15:30');
    expect(screen.getByTestId('draft-block')).toHaveTextContent('(제목 없음) · 15:30-16:30');
  });

  it('쓴 것이 있으면 "작성을 취소할까요?" → 작성 취소면 새 자리, 계속 작성이면 그대로 (Q7, D-037)', async () => {
    const { user, column } = await openDay();
    await user.type(screen.getByRole('textbox', { name: '제목' }), '독서');
    fireEvent.click(column, { clientY: 15 * 48 + 5 });
    await user.click(screen.getByRole('button', { name: '계속 작성' }));
    expect(screen.getByRole('textbox', { name: '제목' })).toHaveValue('독서');
    expect(screen.getByLabelText('시작 시간')).toHaveValue('09:00');

    fireEvent.click(column, { clientY: 15 * 48 + 5 });
    await user.click(screen.getByRole('button', { name: '작성 취소' }));
    expect(screen.getByRole('textbox', { name: '제목' })).toHaveValue('');
    expect(screen.getByLabelText('시작 시간')).toHaveValue('15:00');
  });
});

describe('필터에서 빠진 카테고리로 저장 (US-11, D-056)', () => {
  const openQuickAddFiltered = async () => {
    const view = await setup(1440);
    act(() => {
      view.store.dispatch(setCategoryFilter([2])); // '공부'만
      view.store.dispatch(setViewMode('DAY'));
    });
    fireEvent.click(await screen.findByRole('group', { name: '9월 25일 (금) 시간표' }), { clientY: 9 * 48 + 5 });
    return view;
  };

  it('빠진 카테고리로 저장하면 필터 목록이 펼쳐져 그 줄을 보여 주고, 화면 읽기에 알린다', async () => {
    const { user } = await openQuickAddFiltered();
    await user.type(screen.getByRole('textbox', { name: '제목' }), '보고서');
    await user.selectOptions(screen.getByRole('combobox', { name: '카테고리' }), '업무');
    await user.click(screen.getByRole('button', { name: '저장' }));
    const panel = await screen.findByRole('dialog', { name: '카테고리 선택' });
    expect(within(panel).getByRole('checkbox', { name: '업무' }).closest('label')).toHaveAttribute('data-marked');
    expect(screen.getByRole('status')).toHaveTextContent("'업무'는 필터에서 빠져 있어 달력에 보이지 않아요");
  });

  it('보이는 카테고리로 저장하면 아무 효과 없음', async () => {
    const { user } = await openQuickAddFiltered();
    await user.type(screen.getByRole('textbox', { name: '제목' }), '스터디');
    await user.selectOptions(screen.getByRole('combobox', { name: '카테고리' }), '공부');
    await user.click(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: '빠른 추가' })).not.toBeInTheDocument());
    expect(screen.queryByRole('dialog', { name: '카테고리 선택' })).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('일정 추가 창에서 저장해도 같다', async () => {
    const { user, store } = await setup(1440);
    act(() => {
      store.dispatch(setCategoryFilter([2]));
    });
    await user.click(screen.getAllByRole('button', { name: '추가' })[0]);
    await user.click(screen.getByRole('menuitem', { name: '일정' }));
    const dialog = screen.getByRole('dialog', { name: '일정 추가' });
    await user.type(within(dialog).getByRole('textbox', { name: '제목' }), '운동 가기');
    await user.selectOptions(within(dialog).getByRole('combobox', { name: '카테고리' }), '운동');
    await user.click(within(dialog).getAllByRole('button', { name: '저장' })[0]);
    const panel = await screen.findByRole('dialog', { name: '카테고리 선택' });
    expect(within(panel).getByRole('checkbox', { name: '운동' }).closest('label')).toHaveAttribute('data-marked');
  });
});
