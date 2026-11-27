import { formatHourLabel, type TimeFormat } from '@utils/date/dateUtils';

interface HourLabelsProps {
  /** `00:00` … `23:00` */
  labels: string[];
  hourHeight: number;
  /** 시각 글자 칸 폭 (px) */
  width: number;
  /** 시만 보여 줄지 (모바일 7칸: `6`, `7` …) */
  hourOnly?: boolean;
  className?: string;
  /** 시간 표시 (설정 SET-03). 12시간이면 `오후 1:00`, 좁은 눈금은 숫자와 0시·12시만 오전/오후 (v1.3.1) */
  timeFormat?: TimeFormat;
  /** 시간표 칸 30분 (SET-04): 정각 사이 30분 점선. 높이는 그대로 */
  halfHourLines?: boolean;
}

/** HourLabels - 시간표 왼쪽 시각 눈금 + 가로 점선 (주간·일간 공통). 칸 30분이면 30분 점선을 더한다 */
export default function HourLabels({
  labels,
  hourHeight,
  width,
  hourOnly = false,
  className = 'pr-2 text-[11px]',
  timeFormat = '24H',
  halfHourLines = false,
}: HourLabelsProps) {
  return (
    <div className="pointer-events-none absolute inset-0">
      {labels.map((label, i) => (
        <div key={label} className="absolute inset-x-0 border-t border-dashed border-tp-line" style={{ top: i * hourHeight }}>
          <span className={`absolute -top-2 bg-tp-bg text-right text-tp-muted ${className}`} style={{ width }}>
            {formatHourLabel(Number(label.slice(0, 2)), timeFormat, hourOnly)}
          </span>
        </div>
      ))}
      {halfHourLines &&
        labels.map((label, i) => (
          <div
            key={`${label}-half`}
            data-half-hour-line=""
            className="absolute border-t border-dotted border-tp-line opacity-60"
            style={{ top: (i + 0.5) * hourHeight, left: width, right: 0 }}
          />
        ))}
    </div>
  );
}
