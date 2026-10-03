import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * US-31 · D-060 보안 하한선
 * - next 16.x(16.3.6 이상), react·react-dom 19.2.x — React2Shell(CVE-2025-55182 / CVE-2025-66478),
 *   2026-05·09 Next 보안 릴리스, Next 15 지원 종료(2026-10-21)
 * - lockfile에 공급망 공격 오염 버전이 없어야 한다 (2025-09 Shai-Hulud ~ 2026-08 ChainDrop)
 *   목록: test/security/compromised-packages.txt (출처는 파일 머리에)
 */
const root = join(__dirname, '..', '..');
const lock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8')) as {
  lockfileVersion: number;
  packages: Record<string, { version?: string; link?: boolean }>;
};
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { scripts: Record<string, string> };

/** lockfile 안의 설치될 패키지들: "node_modules/@scope/name" → [name, version] */
const installed = Object.entries(lock.packages)
  .filter(([path, info]) => path.includes('node_modules/') && info.version && !info.link)
  .map(([path, info]) => [path.slice(path.lastIndexOf('node_modules/') + 'node_modules/'.length), info.version as string] as const);

const versionOf = (name: string) => lock.packages[`node_modules/${name}`]?.version ?? '';
const parse = (v: string) => v.split(/[.-]/).slice(0, 3).map(Number);
const atLeast = (v: string, min: string) => {
  const [a, b] = [parse(v), parse(min)];
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return true;
};

/** "name:version" / "npm:name:version" 만 (pypi·composer·crates 제외). 스코프 이름(@a/b)이 있어 마지막 ':'로 자른다 */
export const parseCompromisedList = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => line.replace(/^npm:/, ''))
    .filter((line) => !/^(pypi|composer|crates):/.test(line))
    .map((line) => `${line.slice(0, line.lastIndexOf(':'))}@${line.slice(line.lastIndexOf(':') + 1)}`);

describe('보안 하한선 (US-31, D-060)', () => {
  it('lockfile v3 기반 설치 (npm ci)', () => {
    expect(lock.lockfileVersion).toBe(3);
  });

  it('next는 16.x이고 16.3.6 이상', () => {
    const next = versionOf('next');
    expect(parse(next)[0]).toBe(16);
    expect(atLeast(next, '16.3.6')).toBe(true);
  });

  it('react · react-dom은 19.2.x로 같은 버전', () => {
    expect(versionOf('react')).toMatch(/^19\.2\.\d+$/);
    expect(versionOf('react-dom')).toBe(versionOf('react'));
  });

  it('eslint-config-next는 next와 같은 버전 (Next 16은 next lint가 없어 ESLint를 직접 실행)', () => {
    expect(versionOf('eslint-config-next')).toBe(versionOf('next'));
    expect(pkg.scripts.lint).not.toMatch(/next lint/);
  });
});

describe('공급망 오염 버전 점검 (US-31: Shai-Hulud 2025-09 · ChainDrop 2026-08)', () => {
  const compromised = new Set(parseCompromisedList(readFileSync(join(__dirname, 'compromised-packages.txt'), 'utf8')));

  it('목록 읽기: 스코프 이름과 npm: 접두사를 처리하고 다른 생태계는 뺀다', () => {
    expect(parseCompromisedList('# c\n@ctrl/tinycolor:4.1.1\nnpm:keyv:6.0.0\npypi:foo:1.0\nchalk:5.6.1\n')).toEqual([
      '@ctrl/tinycolor@4.1.1',
      'keyv@6.0.0',
      'chalk@5.6.1',
    ]);
    expect(compromised.has('keyv@6.0.0')).toBe(true); // ChainDrop
    expect(compromised.has('@ctrl/tinycolor@4.1.1')).toBe(true); // Shai-Hulud
  });

  it('lockfile에 오염 버전이 하나도 없다', () => {
    const hits = installed.map(([name, version]) => `${name}@${version}`).filter((id) => compromised.has(id));
    expect(hits).toEqual([]);
  });
});
