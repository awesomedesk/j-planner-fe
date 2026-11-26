import { describe, expect, it } from 'vitest';

import { safeHttpUrl } from './safeHttpUrl';

describe('링크 주소 그리기 전 확인 — http(s)만 (#417 US-44 A05)', () => {
  it.each(['https://meet.example.com/en', 'http://example.com/a?b=1#c', 'HTTPS://EXAMPLE.COM'])('%s → 그대로', (url) => {
    expect(safeHttpUrl(url)).toBe(url);
  });

  it('앞뒤 공백은 지운다', () => {
    expect(safeHttpUrl('  https://example.com  ')).toBe('https://example.com');
  });

  it.each([
    'javascript:alert(1)',
    ' JavaScript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    'ftp://example.com',
    '/relative/path',
    '//example.com',
    'example.com',
    '',
    '   ',
  ])('%j → null (링크를 그리지 않음)', (url) => {
    expect(safeHttpUrl(url)).toBeNull();
  });

  it('값이 없으면 null', () => {
    expect(safeHttpUrl(null)).toBeNull();
    expect(safeHttpUrl(undefined)).toBeNull();
  });
});
