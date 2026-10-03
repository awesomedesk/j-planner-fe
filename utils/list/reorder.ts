import type { Id } from '@/types/api';

/**
 * 끌어서 순서 바꾸기 공통 계산 (US-14, 08-api-design 'PUT /리소스/{id}/position')
 * 서버는 "누구 바로 뒤로"(afterId)만 받는다. 화면에 보이는 것이 전체의 일부여도 된다
 */

/**
 * 끌어 놓은 자리 → afterId
 * @param ids 화면에 보이는 순서
 * @param insertIndex 옮기는 항목을 뺀 나머지 목록에서 끼워 넣을 자리
 * @returns 바로 앞 항목 id, 맨 위면 null, 제자리면 undefined (요청하지 않음)
 */
export const getDropAfterId = (ids: Id[], id: Id, insertIndex: number): Id | null | undefined => {
  const from = ids.indexOf(id);
  if (from < 0 || from === insertIndex) return undefined;
  const rest = ids.filter((x) => x !== id);
  return insertIndex <= 0 ? null : rest[Math.min(insertIndex, rest.length) - 1];
};

/** 끄는 줄의 가운데(y)가 나머지 줄들 중 몇 개의 가운데보다 아래인가 = 끼워 넣을 자리 */
export const getInsertIndex = (others: { top: number; height: number }[], y: number) =>
  others.filter((r) => r.top + r.height / 2 < y).length;

/** 목록을 바로 바꾼다: afterId 바로 뒤로, null이면 맨 앞 (서버와 같은 규칙) */
export const moveAfter = <T extends { id: Id }>(items: T[], id: Id, afterId: Id | null): T[] => {
  const moving = items.find((t) => t.id === id);
  if (!moving) return items;
  const rest = items.filter((t) => t.id !== id);
  const at = afterId === null ? 0 : rest.findIndex((t) => t.id === afterId) + 1;
  return [...rest.slice(0, at), moving, ...rest.slice(at)];
};
