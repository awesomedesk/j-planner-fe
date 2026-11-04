/**
 * TrueType 파일에서 테스트에 필요한 것만 읽는다 (글꼴 자체 호스팅 확인용, #341).
 * - 글자 표(cmap)에 있는 코드포인트 · 이름표(name) · 굵기(OS/2 usWeightClass)
 */

type Table = { offset: number; length: number };

const tables = (b: Buffer) => {
  const count = b.readUInt16BE(4);
  const map = new Map<string, Table>();
  for (let i = 0; i < count; i += 1) {
    const at = 12 + 16 * i;
    map.set(b.toString('latin1', at, at + 4), { offset: b.readUInt32BE(at + 8), length: b.readUInt32BE(at + 12) });
  }
  return map;
};

const table = (b: Buffer, tag: string) => {
  const t = tables(b).get(tag);
  if (!t) throw new Error(`${tag} 표가 없어요`);
  return t.offset;
};

/** 글꼴이 그릴 수 있는 코드포인트 (cmap 형식 12, 없으면 4) */
export function fontCodepoints(b: Buffer): Set<number> {
  const cmap = table(b, 'cmap');
  const subtables = b.readUInt16BE(cmap + 2);
  let best: { format: number; at: number } | null = null;
  for (let i = 0; i < subtables; i += 1) {
    const at = cmap + b.readUInt32BE(cmap + 4 + 8 * i + 4);
    const format = b.readUInt16BE(at);
    if (format === 12) best = { format, at };
    else if (format === 4 && !best) best = { format, at };
  }
  if (!best) throw new Error('읽을 수 있는 cmap이 없어요');
  const cps = new Set<number>();
  const { format, at } = best;
  if (format === 12) {
    const groups = b.readUInt32BE(at + 12);
    for (let i = 0; i < groups; i += 1) {
      const g = at + 16 + 12 * i;
      for (let c = b.readUInt32BE(g); c <= b.readUInt32BE(g + 4); c += 1) cps.add(c);
    }
  } else {
    const segs = b.readUInt16BE(at + 6) / 2;
    for (let i = 0; i < segs; i += 1) {
      const end = b.readUInt16BE(at + 14 + 2 * i);
      const start = b.readUInt16BE(at + 16 + 2 * segs + 2 * i);
      if (start === 0xffff) continue;
      for (let c = start; c <= end; c += 1) cps.add(c);
    }
  }
  return cps;
}

/** 이름표의 한 줄 (Windows 플랫폼, UTF-16BE) */
export function fontName(b: Buffer, nameId: number): string | undefined {
  const name = table(b, 'name');
  const count = b.readUInt16BE(name + 2);
  const strings = name + b.readUInt16BE(name + 4);
  for (let i = 0; i < count; i += 1) {
    const r = name + 6 + 12 * i;
    if (b.readUInt16BE(r) !== 3 || b.readUInt16BE(r + 6) !== nameId) continue;
    const raw = b.subarray(strings + b.readUInt16BE(r + 10), strings + b.readUInt16BE(r + 10) + b.readUInt16BE(r + 8));
    return Buffer.from(raw).swap16().toString('utf16le');
  }
  return undefined;
}

export const fontWeightClass = (b: Buffer) => b.readUInt16BE(table(b, 'OS/2') + 4);

/** CSS unicode-range 값("U+20-7E, U+A0" 등)을 코드포인트 집합으로 */
export function parseUnicodeRange(value: string): Set<number> {
  const cps = new Set<number>();
  for (const part of value.split(',').map((s) => s.trim()).filter(Boolean)) {
    const [a, z = a] = part.replace(/^U\+/i, '').split('-');
    for (let c = parseInt(a, 16); c <= parseInt(z, 16); c += 1) cps.add(c);
  }
  return cps;
}
