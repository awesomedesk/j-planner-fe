import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import NoticeCenter from '@components/notice/NoticeCenter';
import { json, mockApi, problem } from '@/test/mockApi';
import { renderWithStore } from '@/test/render';
import type { PolicyVersion } from '@utils/content/publicDocs';
import { formatEffectiveDate, pickPolicy } from '@utils/content/publicDocs';
import { goTo } from '@utils/navigation';

import AboutPage from './AboutPage';
import ContactPage from './ContactPage';
import HomeGate from './HomeGate';
import PolicyDocument from './PolicyDocument';
import PolicyLinks from './PolicyLinks';
import PublicFooter from './PublicFooter';

vi.mock('@utils/navigation', () => ({ goTo: vi.fn(), currentPath: () => window.location.pathname + window.location.search }));

const ME = { email: 'qa-fe@example.com', name: '검수', hasPassword: true, loginMethods: ['EMAIL'] };
const NOT_LOGGED_IN = () => problem(401, 'UNAUTHENTICATED', '로그인이 필요해요');

/** 테스트용 판 (실제 문안 아님) */
const VERSIONS: PolicyVersion[] = [
  { version: 1, effectiveDate: '2026-12-01', sections: [{ id: 'old', heading: '옛 조항', body: ['옛 문단'] }] },
  {
    version: 2,
    effectiveDate: '2027-01-15',
    sections: [
      { id: 'service', heading: '서비스', body: ['첫 문단', '둘째 문단'] },
      { id: 'contact', heading: '문의', body: ['문의 문단'] },
    ],
  },
];

beforeEach(() => vi.mocked(goTo).mockClear());
afterEach(() => window.history.replaceState(null, '', '/'));

describe('메인 / — 로그인 여부로 나뉨 (US-39 AC1, 06 SITE-01)', () => {
  const openHome = () => {
    window.history.replaceState(null, '', '/');
    return renderWithStore(
      <HomeGate>
        <p>달력 화면</p>
      </HomeGate>
    );
  };

  it('로그인 안 했으면 소개 + [시작하기]→/signup · [로그인]→/login · [둘러보기]→/demo, 로그인 화면으로 보내지 않는다', async () => {
    mockApi({ 'GET /auth/csrf': () => json(204), 'GET /me': NOT_LOGGED_IN });
    openHome();
    expect(await screen.findByRole('heading', { level: 1, name: '일정과 할 일을 한눈에' })).toBeInTheDocument();
    expect(screen.getByText('시간표로 하루를 계획하고, Todo와 기록을 함께 관리해요.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '시작하기' })).toHaveAttribute('href', '/signup');
    expect(screen.getByRole('link', { name: '로그인' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: '둘러보기' })).toHaveAttribute('href', '/demo');
    expect(screen.queryByText('달력 화면')).not.toBeInTheDocument();
    expect(goTo).not.toHaveBeenCalled();
  });

  it('로그인했으면 기존 달력', async () => {
    mockApi({ 'GET /auth/csrf': () => json(204), 'GET /me': () => json(200, ME) });
    openHome();
    expect(await screen.findByText('달력 화면')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '시작하기' })).not.toBeInTheDocument();
  });

  it('메인 아래에 공통 링크 (소개·문의·이용약관·개인정보처리방침)', async () => {
    mockApi({ 'GET /auth/csrf': () => json(204), 'GET /me': NOT_LOGGED_IN });
    openHome();
    const footer = within(await screen.findByRole('contentinfo'));
    expect(footer.getByRole('link', { name: '소개' })).toHaveAttribute('href', '/about');
    expect(footer.getByRole('link', { name: '문의' })).toHaveAttribute('href', '/contact');
    expect(footer.getByRole('button', { name: '이용약관' })).toBeInTheDocument();
    expect(footer.getByRole('button', { name: '개인정보처리방침' })).toBeInTheDocument();
  });
});

describe('약관·처리방침 링크 (US-39 AC2, 06 공개 화면 — 승인 전에는 점선)', () => {
  it('승인된 판이 없으면 점선 자리 — 누르면 "준비 중이에요" (화면을 열지 않음)', async () => {
    const { user } = renderWithStore(
      <>
        <PolicyLinks />
        <NoticeCenter />
      </>
    );
    await user.click(screen.getByRole('button', { name: '이용약관' }));
    expect(await screen.findByRole('status')).toHaveTextContent('준비 중이에요');
    expect(screen.queryByRole('link', { name: '이용약관' })).not.toBeInTheDocument();
  });

  it('승인된 판을 넣으면 같은 링크가 /terms·/privacy로 열린다 (화면마다 복사본 없음)', () => {
    renderWithStore(<PolicyLinks versions={{ terms: VERSIONS, privacy: VERSIONS }} />);
    expect(screen.getByRole('link', { name: '이용약관' })).toHaveAttribute('href', '/terms');
    expect(screen.getByRole('link', { name: '개인정보처리방침' })).toHaveAttribute('href', '/privacy');
  });

  it('공통 아래 줄(footer)도 같은 링크를 쓴다', () => {
    renderWithStore(<PublicFooter versions={{ terms: VERSIONS, privacy: [] }} />);
    const footer = within(screen.getByRole('contentinfo'));
    expect(footer.getByRole('link', { name: '이용약관' })).toHaveAttribute('href', '/terms');
    expect(footer.getByRole('button', { name: '개인정보처리방침' })).toBeInTheDocument();
  });
});

describe('약관·처리방침 화면 /terms·/privacy (US-39, 06 SITE-06·07)', () => {
  it('승인된 판이 없으면 제목 + "아직 공개 전이에요…"만 — 골격·TODO·가짜 조항 없음', () => {
    renderWithStore(<PolicyDocument kind="terms" versions={[]} />);
    expect(screen.getByRole('heading', { level: 1, name: '이용약관' })).toBeInTheDocument();
    expect(screen.getByText('아직 공개 전이에요. 확정되면 이곳에 올려요.')).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/TODO|시행일/);
  });

  it('판이 있으면 제목·시행일·목차(본문으로 이동)·본문·이전 판 링크', () => {
    renderWithStore(<PolicyDocument kind="privacy" versions={VERSIONS} />);
    expect(screen.getByRole('heading', { level: 1, name: '개인정보처리방침' })).toBeInTheDocument();
    expect(screen.getByText('시행일 2027년 1월 15일')).toBeInTheDocument();
    const toc = within(screen.getByRole('navigation', { name: '목차' }));
    expect(toc.getByRole('link', { name: '서비스' })).toHaveAttribute('href', '#service');
    expect(screen.getByRole('heading', { level: 2, name: '서비스' })).toHaveAttribute('id', 'service');
    expect(screen.getByText('둘째 문단')).toBeInTheDocument();
    const previous = within(screen.getByRole('navigation', { name: '이전 판' }));
    expect(previous.getByRole('link', { name: /2026년 12월 1일/ })).toHaveAttribute('href', '/privacy?version=1');
  });

  it('?version=1이면 그 판, 모르는 번호면 최신 판', () => {
    expect(pickPolicy(VERSIONS, '1')?.version).toBe(1);
    expect(pickPolicy(VERSIONS, '9')?.version).toBe(2);
    expect(pickPolicy(VERSIONS, null)?.version).toBe(2);
    expect(pickPolicy([], '1')).toBeNull();
    expect(formatEffectiveDate('2027-01-15')).toBe('2027년 1월 15일');
  });

  it('공개 문서는 로그인 확인·회원 API를 부르지 않는다', () => {
    const api = mockApi({});
    renderWithStore(<PolicyDocument kind="terms" versions={VERSIONS} />);
    expect(api.all()).toHaveLength(0);
  });
});

describe('문의 /contact (US-39, 06 SITE-02)', () => {
  it('승인된 메일이 없으면 메일 주소 자리 없이 안내만, 비밀번호·인증 링크를 보내지 말라는 안내', () => {
    const api = mockApi({});
    renderWithStore(<ContactPage email={null} />);
    expect(screen.getByRole('heading', { level: 1, name: '문의' })).toBeInTheDocument();
    expect(screen.getByText('문의 메일은 정해지면 이곳에 알려 드려요.')).toBeInTheDocument();
    expect(screen.getByText(/비밀번호나 인증 링크는 보내지 마세요/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /@/ })).not.toBeInTheDocument();
    expect(api.all()).toHaveLength(0);
  });

  it('승인된 메일이 있으면 mailto 링크', () => {
    renderWithStore(<ContactPage email="help@example.com" />);
    expect(screen.getByRole('link', { name: 'help@example.com' })).toHaveAttribute('href', 'mailto:help@example.com');
  });
});

describe('소개 /about (US-39, 06 SITE-04)', () => {
  it('일정·Todo·시간 배치·D-Day·일기·메모 소개 + "예시" 표시 + [시작하기]·[둘러보기], 회원 API 없음', () => {
    const api = mockApi({});
    renderWithStore(<AboutPage />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    for (const name of ['일정', 'Todo', '시간 배치', 'D-Day', '일기', '메모']) {
      expect(screen.getByRole('heading', { level: 2, name })).toBeInTheDocument();
    }
    expect(screen.getAllByText('예시').length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: '시작하기' })).toHaveAttribute('href', '/signup');
    expect(screen.getByRole('link', { name: '둘러보기' })).toHaveAttribute('href', '/demo');
    expect(document.body.textContent).not.toMatch(/영구 무료|완전 삭제/);
    expect(api.all()).toHaveLength(0);
  });
});
