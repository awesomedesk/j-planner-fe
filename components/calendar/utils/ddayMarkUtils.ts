import type { Dday, DdayMark, Id, LocalDate } from '@/types/api';

/** 달력 칸에 그릴 D-Day 칩 한 개 (서버가 계산한 label 그대로, D-043) */
export interface DdayChipItem {
  key: string;
  ddayId: Id;
  label: string;
  /** D-Day 제목. 목록을 아직 못 받았으면 빈 글자 (라벨만) */
  title: string;
}

/**
 * 날짜별 D-Day 칩 (US-23)
 * 서버 정렬(date → D-Day 순서)을 그대로 두고 날짜별로 묶는다. 같은 날 여러 D-Day는 목록 순서대로 모두 (06 달력 표시)
 * FE는 날짜를 다시 계산하지 않는다 (D-043)
 */
export const ddayChipsByDate = (marks: DdayMark[], ddays: Dday[]): Map<LocalDate, DdayChipItem[]> => {
  const titles = new Map(ddays.map((d) => [d.id, d.title]));
  const byDate = new Map<LocalDate, DdayChipItem[]>();
  marks.forEach((mark) => {
    const list = byDate.get(mark.date) ?? [];
    list.push({ key: `dday-${mark.ddayId}-${mark.date}`, ddayId: mark.ddayId, label: mark.label, title: titles.get(mark.ddayId) ?? '' });
    byDate.set(mark.date, list);
  });
  return byDate;
};

/** 칩 접근 이름·글자: 'D-3 기말 시험' (제목이 없으면 라벨만) */
export const ddayChipText = (chip: DdayChipItem) => (chip.title ? `${chip.label} ${chip.title}` : chip.label);
