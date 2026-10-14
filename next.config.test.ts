import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

const loadRewrites = async () => {
  const { default: config } = await import('./next.config.mjs');
  return config.rewrites ? await config.rewrites() : [];
};

describe('개발 서버가 /api를 BE로 넘긴다 (US-34, 08 13-1)', () => {
  it('API_PROXY_TARGET이 있으면 /api/:path* → <BE>/api/:path*', async () => {
    vi.stubEnv('API_PROXY_TARGET', 'http://localhost:8080');
    expect(await loadRewrites()).toEqual([{ source: '/api/:path*', destination: 'http://localhost:8080/api/:path*' }]);
  });

  it('끝의 / 는 한 번만', async () => {
    vi.stubEnv('API_PROXY_TARGET', 'http://localhost:8080/');
    expect(await loadRewrites()).toEqual([{ source: '/api/:path*', destination: 'http://localhost:8080/api/:path*' }]);
  });

  it('없으면 넘기지 않는다 (운영은 앞단 서버가 같은 주소로 묶음)', async () => {
    vi.stubEnv('API_PROXY_TARGET', '');
    expect(await loadRewrites()).toEqual([]);
  });
});
