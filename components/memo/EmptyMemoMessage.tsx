import { EMPTY_MEMO_MESSAGE } from './utils/memoUtils';

/** 메모가 하나도 없을 때 흐린 안내 (D-057) */
export default function EmptyMemoMessage() {
  return <p className="py-3 text-center text-[13px] text-tp-muted">{EMPTY_MEMO_MESSAGE}</p>;
}
