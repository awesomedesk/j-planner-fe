interface HourLabelsProps {
  /** `00:00` … `23:00` */
  labels: string[];
  hourHeight: number;
  /** 시각 글자 칸 폭 (px) */
  width: number;
  /** 시만 보여 줄지 (모바일 7칸: `6`, `7` …) */
  hourOnly?: boolean;
  className?: string;
}

/** HourLabels - 시간표 왼쪽 시각 눈금 + 가로 점선 (주간·일간 공통) */
export default function HourLabels({ labels, hourHeight, width, hourOnly = false, className = 'pr-2 text-[11px]' }: HourLabelsProps) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {labels.map((label, i) => (
        <div key={label} className="absolute inset-x-0 border-t border-dashed border-tp-line" style={{ top: i * hourHeight }}>
          <span className={`absolute -top-2 bg-tp-bg text-right text-tp-muted ${className}`} style={{ width }}>
            {hourOnly ? String(Number(label.slice(0, 2))) : label}
          </span>
        </div>
      ))}
    </div>
  );
}
