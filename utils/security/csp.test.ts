import { describe, expect, it } from 'vitest';

import { apiOriginOf, buildContentSecurityPolicy, createNonce } from './csp';

const directives = (policy: string) =>
  Object.fromEntries(policy.split(';').map((part) => part.trim().split(/\s+/)).map(([name, ...values]) => [name, values]));

describe('화면 CSP 정책 (#417 US-44 A02, nonce + Report-Only)', () => {
  it('스크립트는 같은 출처 + 요청마다 다른 nonce만, 인라인·eval은 허용하지 않는다 (운영)', () => {
    const d = directives(buildContentSecurityPolicy({ nonce: 'abc123', isDev: false }));
    expect(d['script-src']).toEqual(["'self'", "'nonce-abc123'", "'strict-dynamic'"]);
    expect(d['script-src']).not.toContain("'unsafe-inline'");
    expect(d['script-src']).not.toContain("'unsafe-eval'");
  });

  it('기본·글꼴·이미지·연결은 같은 출처, 플러그인 금지, base·form 같은 출처, 다른 사이트 틀 금지', () => {
    const d = directives(buildContentSecurityPolicy({ nonce: 'n', isDev: false }));
    expect(d['default-src']).toEqual(["'self'"]);
    expect(d['font-src']).toEqual(["'self'"]);
    expect(d['img-src']).toEqual(["'self'", 'blob:', 'data:']);
    expect(d['connect-src']).toEqual(["'self'"]);
    expect(d['object-src']).toEqual(["'none'"]);
    expect(d['base-uri']).toEqual(["'self'"]);
    expect(d['form-action']).toEqual(["'self'"]);
    expect(d['frame-ancestors']).toEqual(["'none'"]);
  });

  it('API 주소가 다른 출처면 connect-src에 그 출처만 더한다', () => {
    const d = directives(buildContentSecurityPolicy({ nonce: 'n', isDev: false, apiOrigin: 'https://test-api.j-planner.com' }));
    expect(d['connect-src']).toEqual(["'self'", 'https://test-api.j-planner.com']);
  });

  it("개발 서버(next dev)만 'unsafe-eval'과 웹소켓(화면 새로 고침)을 더 허용한다", () => {
    const d = directives(buildContentSecurityPolicy({ nonce: 'n', isDev: true }));
    expect(d['script-src']).toContain("'unsafe-eval'");
    expect(d['connect-src']).toEqual(["'self'", 'ws:', 'wss:']);
  });

  it('apiOriginOf — 절대 주소면 출처, 비었거나 상대 주소면 null(같은 출처)', () => {
    expect(apiOriginOf('https://test-api.j-planner.com/api/v1')).toBe('https://test-api.j-planner.com');
    expect(apiOriginOf('')).toBeNull();
    expect(apiOriginOf(undefined)).toBeNull();
    expect(apiOriginOf('/api/v1')).toBeNull();
  });

  it('nonce는 요청마다 새로 만들고, 정책에 넣어도 안전한 글자(base64)만 쓴다', () => {
    const a = createNonce();
    const b = createNonce();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9+/=]{16,}$/);
  });
});
