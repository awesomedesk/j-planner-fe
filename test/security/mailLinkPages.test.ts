import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import nextConfig from '../../next.config.mjs';

const root = join(__dirname, '..', '..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');

/** 메일 링크로 여는 화면 (토큰이 주소에 들어 있음) */
const MAIL_LINK_PAGES = [
  { url: '/signup/verify', file: 'app/signup/verify/page.tsx' },
  { url: '/password/reset', file: 'app/password/reset/page.tsx' },
];

/** 바깥 주소(http·https·//)를 부르는 코드 */
const EXTERNAL_URL = /["'`](https?:)?\/\/(?!localhost)[a-z0-9.-]+\.[a-z]{2,}/i;

describe('메일 링크 화면 — 토큰이 새지 않게 (US-33·35, D-079 · 11 문서)', () => {
  it.each(MAIL_LINK_PAGES)('$url 응답에 Referrer-Policy: no-referrer', async ({ url }) => {
    const rules = (await nextConfig.headers?.()) ?? [];
    const rule = rules.find((r) => r.source === url);
    expect(rule?.headers).toContainEqual({ key: 'Referrer-Policy', value: 'no-referrer' });
  });

  it.each(MAIL_LINK_PAGES)('$url 화면 HTML에도 <meta name="referrer" content="no-referrer"> (metadata)', ({ file }) => {
    expect(existsSync(join(root, file))).toBe(true);
    expect(read(file)).toMatch(/referrer:\s*['"]no-referrer['"]/);
  });

  it('맨 바깥 레이아웃(모든 화면 공통)은 바깥 리소스를 부르지 않는다 — 글꼴은 메일 링크가 아닌 화면 묶음 (site) 레이아웃에서만', () => {
    expect(read('app/layout.tsx')).not.toMatch(EXTERNAL_URL);
    expect(read('app/(site)/layout.tsx')).toContain('fonts.googleapis.com');
    for (const { file } of MAIL_LINK_PAGES) {
      expect(file.startsWith('app/(site)/')).toBe(false);
      expect(read(file)).not.toMatch(EXTERNAL_URL);
    }
  });

  it.each([
    'components/auth/signup/VerifyEmailPage.tsx',
    'components/auth/password/ResetPasswordPage.tsx',
    'components/auth/common/AuthFrame.tsx',
    'components/auth/common/NewPasswordField.tsx',
  ])('%s 도 바깥 주소를 부르지 않는다', (file) => {
    expect(read(file)).not.toMatch(EXTERNAL_URL);
  });

  it('메일 링크가 아닌 화면(달력·로그인·가입·비밀번호 찾기)은 (site) 묶음에 있다', () => {
    for (const file of ['app/(site)/page.tsx', 'app/(site)/login/page.tsx', 'app/(site)/signup/page.tsx', 'app/(site)/password/forgot/page.tsx']) {
      expect(existsSync(join(root, file))).toBe(true);
    }
  });
});
