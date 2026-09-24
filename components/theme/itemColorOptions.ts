import type { HexColor } from '@/types/api';

/**
 * 항목(일정·Todo·카테고리)에서 고를 수 있는 색 (화면기획서 OV-01 ③, OV-04 색 점)
 * 일정·Todo는 이 밖에 '선택 안 함'(null → 테마 Theme2, D-030)이 있다.
 */
export const ITEM_COLOR_OPTIONS: readonly HexColor[] = [
  '#2F62A8',
  '#A6323F',
  '#2F7A4B',
  '#8A5A00',
  '#5B5F97',
  '#3F3F3F',
];
