import { MEMO_TITLE_MAX_LENGTH, shouldShowTitleCounter } from './utils/memoUtils';

/** 제목 글자 수 'n/255' — 230자부터만 보인다 (D-057) */
export default function MemoTitleCounter({ title, className = '' }: { title: string; className?: string }) {
  if (!shouldShowTitleCounter(title)) return null;
  return (
    <span className={`shrink-0 text-tp-muted ${className}`}>
      {title.length}/{MEMO_TITLE_MAX_LENGTH}
    </span>
  );
}
