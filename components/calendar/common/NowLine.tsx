import { formatClock } from '@utils/date/dateUtils';

interface NowLineProps {
  /** 00:00부터의 분 */
  minutes: number;
  hourHeight: number;
  now: Date;
  /** 왼쪽 끝 점 (좁은 모바일 7칸은 없음) */
  showDot?: boolean;
}

/** NowLine - 시간표의 빨간 현재 시각 선 (CAL-06). 오늘 칸에만 그린다 */
export default function NowLine({ minutes, hourHeight, now, showDot = true }: NowLineProps) {
  return (
    <div
      role="separator"
      aria-label={`현재 시각 ${formatClock(now)}`}
      className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-danger"
      style={{ top: `${(minutes / 60) * hourHeight}px` }}
    >
      {showDot && <span className="absolute -left-[5px] -top-[6px] h-2.5 w-2.5 rounded-full bg-danger" />}
    </div>
  );
}
