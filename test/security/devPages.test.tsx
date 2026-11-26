import { afterEach, describe, expect, it, vi } from 'vitest';

import { devPagesEnabled } from '@env/devPages';

import DevLayout from '../../app/(site)/dev/layout';

afterEach(() => vi.unstubAllEnvs());

describe('개발용 화면 /dev/* — 운영 빌드에서 빼기 (#417 US-44 A02 · PO 결정 4)', () => {
  it.each([
    ['development', 'local', true],
    ['development', 'test', true],
    ['test', undefined, true], // vitest
    ['development', 'production', false], // 운영 설정으로 띄운 개발 서버
    ['production', 'test', false], // npm run build + start
    ['production', 'local', false], // build:local + start:local
    ['production', 'production', false], // build:prod
  ] as const)('NODE_ENV=%s · APP_ENV=%s → %s', (nodeEnv, appEnv, expected) => {
    expect(devPagesEnabled(nodeEnv, appEnv)).toBe(expected);
  });

  it('열 수 없을 때 /dev 레이아웃은 404(notFound)로 끝난다', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(() => DevLayout({ children: 'x' })).toThrow(/NEXT_HTTP_ERROR_FALLBACK;404/);
  });

  it('개발에서는 그대로 보여 준다', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_APP_ENV', 'local');
    expect(DevLayout({ children: 'x' })).toBe('x');
  });
});
