import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

const root = join(__dirname, '..', '..');

/** 화면 코드 (테스트·자동 생성 타입 제외) */
const SOURCE_DIRS = ['app', 'components', 'utils', 'env', 'types'];
const SOURCE_FILES = ['proxy.ts', 'next.config.mjs'];
const isSource = (path: string) => /\.(ts|tsx|js|mjs)$/.test(path) && !/\.test\.(ts|tsx)$/.test(path) && !path.endsWith('schema.d.ts');

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });

const sources = () => [
  ...SOURCE_DIRS.flatMap((dir) => walk(join(root, dir))),
  ...SOURCE_FILES.map((file) => join(root, file)),
].filter(isSource);

/** 금지: HTML을 그대로 넣기·문자열 코드 실행·오래 남는 브라우저 저장소 (점검표 A05·A04) */
const BANNED: [string, RegExp][] = [
  ['dangerouslySetInnerHTML', /dangerouslySetInnerHTML/],
  ['innerHTML / outerHTML', /\.(inner|outer)HTML\b/],
  ['insertAdjacentHTML', /insertAdjacentHTML/],
  ['document.write', /document\.write(ln)?\s*\(/],
  ['eval', /(^|[^\w.])eval\s*\(/],
  ['new Function', /new\s+Function\s*\(/],
  ['문자열 setTimeout·setInterval', /set(Timeout|Interval)\s*\(\s*['"`]/],
  ['localStorage', /localStorage/],
  ['href에 일정 url을 바로 (safeHttpUrl 거치기)', /href=\{[^}]*\.url\}/],
];

describe('정적 금지 검사 — HTML 주입·문자열 코드 실행·localStorage (#417 US-44 A05 · PO 결정 3)', () => {
  it('검사할 파일이 있다', () => {
    expect(sources().length).toBeGreaterThan(100);
  });

  it.each(BANNED)('%s 를 쓰는 화면 코드가 없다', (_name, pattern) => {
    const hits = sources().filter((file) => pattern.test(readFileSync(file, 'utf8')));
    expect(hits.map((file) => relative(root, file))).toEqual([]);
  });
});

describe('브라우저 묶음에 들어가는 공개 변수 (#417 US-44 A02 · PO 결정 3)', () => {
  const UNUSED = ['NEXT_PUBLIC_FIREBASE_API_KEY', 'NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY', 'NEXT_PUBLIC_TEST_USER_EMAIL', 'NEXT_PUBLIC_AUTH_DOMAIN'];
  const ENV_FILES = ['env/config.ts', '.env.example', '.env.local', '.env.test', '.env.production'];

  it.each(UNUSED)('쓰지 않는 %s 는 설정·환경 파일에서 뺐다', (name) => {
    for (const file of ENV_FILES) expect(readFileSync(join(root, file), 'utf8'), file).not.toContain(name);
  });
});
