/**
 * 서버를 켜기 전에 PATH의 node 버전을 확인한다 (#343).
 * Turbopack은 CSS(PostCSS) 자식 프로세스를 PATH의 `node`로 띄운다 — next를 Node 22로 실행해도
 * PATH 앞쪽에 오래된 node(예: /usr/local/bin/node 14)가 있으면 그 node로 떠서 500이 나고,
 * 실패 결과가 .next/cache/turbopack에 남아 PATH를 고쳐도 계속 실패한다.
 */
import { execFileSync } from 'node:child_process';

/** Next 16이 요구하는 최소 버전 */
export const MIN_NODE = [20, 9, 0];

const parse = (version) => version.replace(/^v/, '').split('.').map((n) => Number(n) || 0);

const atLeast = (version, min) => {
  const v = parse(version);
  for (let i = 0; i < min.length; i += 1) {
    if ((v[i] ?? 0) !== min[i]) return (v[i] ?? 0) > min[i];
  }
  return true;
};

/**
 * @param {string} version PATH의 `node -v` (예: v22.19.0, 없으면 '')
 * @param {string} [where] 그 node의 위치 (안내용)
 * @returns {{ ok: boolean, message: string }}
 */
export function checkNodeOnPath(version, where = 'node') {
  if (version && atLeast(version, MIN_NODE)) return { ok: true, message: '' };
  const found = version ? `${version} (${where})` : '찾을 수 없음';
  return {
    ok: false,
    message: [
      `PATH의 node가 ${found} — Next 16은 Node ${MIN_NODE.join('.')} 이상이 필요해요.`,
      'Turbopack이 CSS 처리 프로세스를 이 node로 띄워서 500이 나요.',
      '고치는 법: `nvm use 22` (또는 PATH 맨 앞에 Node 22 폴더)로 바꾼 뒤 다시 켜 주세요.',
      '이미 500을 본 적이 있으면 실패 결과가 남아 있으니 .next/cache/turbopack 폴더를 지우고 켜 주세요.',
    ].join('\n'),
  };
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
  let version = '';
  let where = 'node';
  try {
    version = execFileSync('node', ['-v'], { encoding: 'utf8' }).trim();
    where = execFileSync('/bin/sh', ['-c', 'command -v node'], { encoding: 'utf8' }).trim();
  } catch {
    // 못 찾으면 version = ''
  }
  const result = checkNodeOnPath(version, where);
  if (!result.ok) {
    console.error(result.message);
    process.exit(1);
  }
}
