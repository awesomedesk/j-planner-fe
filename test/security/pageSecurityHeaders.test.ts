import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import nextConfig from '../../next.config.mjs';
import { config as proxyConfig, proxy } from '../../proxy';

const REPORT_ONLY = 'content-security-policy-report-only';

const rulesFor = async (source: string) => ((await nextConfig.headers?.()) ?? []).filter((rule) => rule.source === source);
const headerOf = (rules: { headers: { key: string; value: string }[] }[], key: string) =>
  rules.flatMap((rule) => rule.headers).find((header) => header.key.toLowerCase() === key.toLowerCase())?.value;

afterEach(() => vi.unstubAllEnvs());

describe('화면 응답 보안 헤더 (#417 US-44 A02 · PO 결정 1)', () => {
  it.each([
    ['X-Content-Type-Options', 'nosniff'],
    ['Referrer-Policy', 'strict-origin-when-cross-origin'],
    ['X-Frame-Options', 'DENY'],
    ['Content-Security-Policy', "frame-ancestors 'none'"],
  ])('모든 화면에 %s: %s', async (key, value) => {
    expect(headerOf(await rulesFor('/:path*'), key)).toBe(value);
  });

  it('메일 링크 화면의 Referrer-Policy: no-referrer가 공통 규칙보다 뒤에 있어 이긴다 (D-079)', async () => {
    const rules = (await nextConfig.headers?.()) ?? [];
    const common = rules.findIndex((rule) => rule.source === '/:path*');
    const mail = rules.findIndex((rule) => rule.source === '/signup/verify');
    expect(common).toBeGreaterThanOrEqual(0);
    expect(mail).toBeGreaterThan(common);
  });

  it('X-Powered-By를 보내지 않는다 (poweredByHeader: false)', () => {
    expect(nextConfig.poweredByHeader).toBe(false);
  });

  it('운영 빌드에 브라우저 소스맵을 만들지 않는다 (productionBrowserSourceMaps 끔)', () => {
    expect(nextConfig.productionBrowserSourceMaps ?? false).toBe(false);
  });
});

describe('CSP Report-Only + nonce — proxy (#417 PO 결정 1)', () => {
  const run = (path = '/') => proxy(new NextRequest(`http://localhost:3000${path}`));

  it('화면 응답에 Content-Security-Policy-Report-Only를 붙이고, 같은 nonce를 요청 머리(x-nonce·CSP)로 Next에 넘긴다', () => {
    const response = run();
    const policy = response.headers.get(REPORT_ONLY) ?? '';
    const nonce = policy.match(/'nonce-([^']+)'/)?.[1];
    expect(nonce).toBeTruthy();
    expect(response.headers.get('x-middleware-request-x-nonce')).toBe(nonce);
    expect(response.headers.get(`x-middleware-request-${REPORT_ONLY}`)).toBe(policy);
  });

  it('실제로 막는 CSP(Content-Security-Policy)는 아직 proxy가 붙이지 않는다 (막기 전환은 배포 준비 때, 🚧)', () => {
    expect(run().headers.get('content-security-policy')).toBeNull();
  });

  it('nonce는 요청마다 다르다', () => {
    const nonceOf = () => run().headers.get('x-middleware-request-x-nonce');
    expect(nonceOf()).not.toBe(nonceOf());
  });

  it('화면은 요청마다 그려야 nonce가 붙는다 — 맨 바깥 레이아웃이 connection()을 기다린다 (정적 HTML이면 nonce 없음)', () => {
    const layout = readFileSync(join(__dirname, '..', '..', 'app', 'layout.tsx'), 'utf8');
    expect(layout).toMatch(/await connection\(\)/);
  });

  it('API(BE가 헤더를 맡음)·정적 파일·글꼴에는 돌지 않는다', () => {
    const matchers = proxyConfig.matcher.map((m) => new RegExp(`^${typeof m === 'string' ? m : m.source}$`));
    const matches = (path: string) => matchers.some((re) => re.test(path));
    expect(matches('/')).toBe(true);
    expect(matches('/login')).toBe(true);
    expect(matches('/me')).toBe(true);
    expect(matches('/api/v1/health')).toBe(false);
    expect(matches('/_next/static/chunks/a.js')).toBe(false);
    expect(matches('/fonts/ibm-plex-sans-kr/1.1.0/ibm-plex-sans-kr.css')).toBe(false);
    expect(matches('/favicon.ico')).toBe(false);
  });
});
