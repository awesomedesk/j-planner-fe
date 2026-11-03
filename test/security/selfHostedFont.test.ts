import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import nextConfig from '../../next.config.mjs';

const root = join(__dirname, '..', '..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');

/** 글꼴 버전 경로 (#342, 공식 @ibm/plex-sans-kr 1.1.0) */
const FONT_DIR = 'public/fonts/ibm-plex-sans-kr/1.1.0';
const FONT_URL = '/fonts/ibm-plex-sans-kr/1.1.0';
const CSS = `${FONT_DIR}/ibm-plex-sans-kr.css`;

const faces = () => read(CSS).split('@font-face').slice(1);

describe('글꼴 자체 호스팅 — IBM Plex Sans KR 1.1.0 (#342, D-099 · #336 계획)', () => {
  it('일반 화면 묶음이 Google Fonts를 부르지 않고 같은 출처 글꼴 CSS를 부른다', () => {
    const layout = read('app/(site)/layout.tsx');
    expect(layout).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com/);
    expect(layout).toContain(`${FONT_URL}/ibm-plex-sans-kr.css`);
  });

  it('@font-face는 400·500·600·700만, 모두 공식 unicode-range + font-display: swap + 같은 출처 split woff2', () => {
    const list = faces();
    expect(list.length).toBeGreaterThan(0);
    const weights = new Set(list.map((f) => f.match(/font-weight:\s*(\d+)/)?.[1]));
    expect([...weights].sort()).toEqual(['400', '500', '600', '700']);
    for (const face of list) {
      expect(face).toMatch(/font-family:\s*"IBM Plex Sans KR"/);
      expect(face).toMatch(/font-display:\s*swap/);
      expect(face).toMatch(/unicode-range:/);
      const urls = [...face.matchAll(/url\("([^"]+)"\)/g)].map((m) => m[1]);
      expect(urls.length).toBe(1);
      expect(urls[0]).toMatch(new RegExp(`^${FONT_URL}/split/IBMPlexSansKR-(Regular|Medium|SemiBold|Bold)-\\d{2}\\.woff2$`));
    }
  });

  it('CSS가 가리키는 파일이 모두 있고, SHA256SUMS(공식 배포본 그대로)와 해시가 같다', () => {
    const sums = new Map(
      read(`${FONT_DIR}/SHA256SUMS`)
        .trim()
        .split('\n')
        .map((line) => {
          const [hash, file] = line.split(/\s+/);
          return [file, hash] as const;
        })
    );
    for (const face of faces()) {
      const url = face.match(/url\("([^"]+)"\)/)![1];
      const rel = url.replace(`${FONT_URL}/`, '');
      const path = join(root, FONT_DIR, rel);
      expect(existsSync(path)).toBe(true);
      expect(createHash('sha256').update(readFileSync(path)).digest('hex')).toBe(sums.get(rel));
    }
  });

  it('OFL 전문(저작권·예약 이름 "Plex")을 같이 배포하고 /about에서 열 수 있다', () => {
    const license = read(`${FONT_DIR}/LICENSE.txt`);
    expect(license).toContain('Reserved Font Name "Plex"');
    expect(license).toContain('SIL OPEN FONT LICENSE Version 1.1');
    expect(read('components/public/AboutPage.tsx')).toContain(`${FONT_URL}/LICENSE.txt`);
  });

  it('버전 경로라 오래 캐시한다 (Cache-Control immutable)', async () => {
    const rules = (await nextConfig.headers?.()) ?? [];
    const rule = rules.find((r) => r.source === '/fonts/:path*');
    expect(rule?.headers).toContainEqual({ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' });
  });

  it('못 받으면 시스템 글꼴로 보인다 (globals.css 대체 글꼴 그대로)', () => {
    expect(read('app/globals.css')).toMatch(/font-family:\s*'IBM Plex Sans KR',\s*system-ui/);
  });
});
