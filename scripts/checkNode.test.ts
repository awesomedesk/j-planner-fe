import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { checkNodeOnPath, MIN_NODE } from './checkNode.mjs';

describe('서버를 켜기 전 PATH의 node 버전 확인 (#343 Turbopack CSS 자식 프로세스)', () => {
  it('Next 16은 Node 20.9 이상 — 26.13.0(.nvmrc 기본)·22.19.0·20.9.0은 통과', () => {
    expect(MIN_NODE).toEqual([20, 9, 0]);
    expect(checkNodeOnPath('v26.13.0').ok).toBe(true);
    expect(checkNodeOnPath('v22.19.0').ok).toBe(true);
    expect(checkNodeOnPath('v20.9.0').ok).toBe(true);
  });

  it('14.17.6·16.17.0·20.8.1은 멈추고, 무엇을 하면 되는지 한국어로 알려 준다', () => {
    for (const version of ['v14.17.6', 'v16.17.0', 'v20.8.1']) {
      const result = checkNodeOnPath(version, '/usr/local/bin/node');
      expect(result.ok).toBe(false);
      expect(result.message).toContain(version);
      expect(result.message).toContain('/usr/local/bin/node');
      expect(result.message).toMatch(/nvm use 26/);
      expect(result.message).toMatch(/\.next\/cache\/turbopack/);
    }
  });

  it('.nvmrc는 현재 LTS Node 26 (2026-10-28 LTS 시작, 대표님 11-04 검토 요청)', () => {
    expect(readFileSync(join(__dirname, '..', '.nvmrc'), 'utf8').trim()).toBe('26');
  });

  it('node를 못 찾으면(빈 값) 멈춘다', () => {
    expect(checkNodeOnPath('').ok).toBe(false);
  });
});
