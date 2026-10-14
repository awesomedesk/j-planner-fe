import { describe, expect, it } from 'vitest';

import { loginPathFor, safeNextPath } from './nextPath';

describe('로그인 뒤 갈 곳 ?next= (US-34, D-072: 우리 사이트 안의 경로만)', () => {
  it.each([
    ['/', '/'],
    ['/?view=week', '/?view=week'],
    ['/dev/categories#top', '/dev/categories#top'],
  ])('사이트 안 경로 %s → 그대로', (raw, expected) => {
    expect(safeNextPath(raw)).toBe(expected);
  });

  it.each([
    [null],
    [''],
    ['https://evil.example.com'],
    ['//evil.example.com/x'],
    ['/\\evil.example.com'],
    ['javascript:alert(1)'],
    ['week'],
    ['/login'],
    ['/login?next=%2F'],
  ])('바깥 주소·이상한 값 %s → 달력(/)', (raw) => {
    expect(safeNextPath(raw)).toBe('/');
  });

  it('로그인 안 한 채 연 화면 → /login?next=<그 화면>', () => {
    expect(loginPathFor('/?view=week')).toBe('/login?next=%2F%3Fview%3Dweek');
  });

  it('첫 화면(/)이면 next 없이 /login (로그인하면 어차피 달력)', () => {
    expect(loginPathFor('/')).toBe('/login');
  });
});
