import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import tailwindConfig from '../../tailwind.config';
import { fontCodepoints, fontName, fontWeightClass, parseUnicodeRange } from '../fontFile';

const root = join(__dirname, '..', '..');
const read = (path: string) => readFileSync(join(root, path), 'utf8');

/** 구글 버튼 글꼴 버전 경로 (#341, 공식 googlefonts/googlesans v14.000) */
const FONT_DIR = 'public/fonts/google-sans/14.000';
const FONT_URL = '/fonts/google-sans/14.000';
const CSS = `${FONT_DIR}/google-sans.css`;
const TTF = 'GoogleSans-Medium.ttf';
/** 공식 릴리스 GoogleSans-v14.000.zip 속 build/GoogleSans/static/GoogleSans-Medium.ttf 의 SHA-256 (2026-11-04 FE 확인) */
const OFFICIAL_TTF_SHA256 = '1c87b72912ef81b48ab4852976f3d5bf75c7205e0a58a97ffca947d171c722a7';

const sha256 = (buf: Buffer) => createHash('sha256').update(buf).digest('hex');
const faces = () => read(CSS).split('@font-face').slice(1);
const ttf = () => readFileSync(join(root, FONT_DIR, TTF));

describe('구글 버튼 글꼴 — 공식 Google Sans Medium 자체 호스팅 (#341, D-097 · D-099)', () => {
  it('공식 배포 파일을 바꾸지 않고 둔다 — 해시가 공식 릴리스·SHA256SUMS와 같다', () => {
    const buf = ttf();
    expect(sha256(buf)).toBe(OFFICIAL_TTF_SHA256);
    const sums = read(`${FONT_DIR}/SHA256SUMS`);
    expect(sums).toContain(`${OFFICIAL_TTF_SHA256}  ${TTF}`);
  });

  it('파일이 가이드가 말하는 Google Sans Medium(500)이고, 한글 글자는 없다', () => {
    const buf = ttf();
    expect(fontName(buf, 4)).toBe('Google Sans Medium');
    expect(fontName(buf, 5)).toMatch(/^Version 14\.000/);
    expect(fontWeightClass(buf)).toBe(500);
    const cps = fontCodepoints(buf);
    expect([...'Google'].every((ch) => cps.has(ch.codePointAt(0)!))).toBe(true);
    expect([...'구글로 계속하기'].filter((ch) => ch !== ' ').some((ch) => cps.has(ch.codePointAt(0)!))).toBe(false);
  });

  it('@font-face 하나: "Google Sans" 500 · normal · swap · 같은 출처 파일 하나 · 내 컴퓨터 글꼴(local) 안 씀', () => {
    const list = faces();
    expect(list).toHaveLength(1);
    const face = list[0];
    expect(face).toMatch(/font-family:\s*"Google Sans"/);
    expect(face).toMatch(/font-weight:\s*500;/);
    expect(face).toMatch(/font-style:\s*normal/);
    expect(face).toMatch(/font-display:\s*swap/);
    expect(face).not.toMatch(/local\(/);
    const urls = [...face.matchAll(/url\("([^"]+)"\)/g)].map((m) => m[1]);
    expect(urls).toEqual([`${FONT_URL}/${TTF}`]);
    expect(face).toContain('format("truetype")');
  });

  it('unicode-range = 파일에 있는 글자에서 공백만 뺀 것 → 한글·공백만 있는 버튼 문구(구글로 계속하기)는 글꼴 파일을 받지 않는다', () => {
    const range = faces()[0].match(/unicode-range:\s*([^;]+);/)?.[1] ?? '';
    const declared = parseUnicodeRange(range);
    const isSpace = (c: number) => /\s/u.test(String.fromCodePoint(c));
    const inFont = new Set([...fontCodepoints(ttf())].filter((c) => !isSpace(c)));
    expect([...declared].some(isSpace)).toBe(false);
    expect(declared.size).toBe(inFont.size);
    expect([...inFont].every((c) => declared.has(c))).toBe(true);
    expect([...declared].some((c) => (c >= 0xac00 && c <= 0xd7a3) || (c >= 0x1100 && c <= 0x11ff) || (c >= 0x3130 && c <= 0x318f))).toBe(false);
  });

  it('OFL 전문·상표 안내를 같이 배포하고 /about에서 열 수 있다', () => {
    const license = read(`${FONT_DIR}/OFL.txt`);
    expect(license).toContain('SIL OPEN FONT LICENSE Version 1.1');
    expect(read(`${FONT_DIR}/TRADEMARKS.txt`)).toContain('Reserved Font Names');
    for (const file of ['OFL.txt', 'TRADEMARKS.txt']) {
      expect(read(`${FONT_DIR}/SHA256SUMS`)).toContain(`${sha256(readFileSync(join(root, FONT_DIR, file)))}  ${file}`);
    }
    const about = read('components/public/AboutPage.tsx');
    expect(about).toContain(`${FONT_URL}/OFL.txt`);
  });

  it('화면 묶음이 같은 출처 CSS만 부른다 (Google Fonts·GIS 외부 호출 없음)', () => {
    const layout = read('app/(site)/layout.tsx');
    expect(layout).toContain(`${FONT_URL}/google-sans.css`);
    expect(layout).not.toMatch(/fonts\.googleapis\.com|fonts\.gstatic\.com|accounts\.google\.com\/gsi/);
    expect(existsSync(join(root, CSS))).toBe(true);
  });

  it('버튼 글꼴 = Google Sans, 한글은 IBM Plex Sans KR, 그다음 시스템 글꼴', () => {
    const families = tailwindConfig.theme?.extend?.fontFamily as Record<string, string[]> | undefined;
    expect(families?.['google-button']).toEqual(['"Google Sans"', '"IBM Plex Sans KR"', 'system-ui', 'sans-serif']);
    // 4개 사용 경로(로그인·가입·구글 가입 확인·다시 로그인 창)가 모두 이 부품을 쓴다
    expect(read('components/auth/common/GoogleButton.tsx')).toMatch(/\bfont-google-button\b.*\bfont-medium\b/);
  });
});
