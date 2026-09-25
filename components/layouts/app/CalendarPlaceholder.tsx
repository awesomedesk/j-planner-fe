/**
 * CalendarPlaceholder - 아직 없는 보기 자리 (주간 US-07, 일간 US-08)
 */
export default function CalendarPlaceholder({ label = '달력 자리' }: { label?: string }) {
  return (
    <div className="flex min-h-0 flex-1 p-3">
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-tp-line text-sm text-tp-muted">{label}</div>
    </div>
  );
}
