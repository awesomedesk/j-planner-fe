export const MONTHS_KR = [
  "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월"
] as const;

export const WEEKDAYS_KR = ["일", "월", "화", "수", "목", "금", "토"] as const;

export const MS_PER_DAY = 86400000;

export const WEEKDAY_COLORS = {
  SUNDAY: 'text-red-500',
  SATURDAY: 'text-blue-500',
  WEEKDAY: ''
} as const;

export const CALENDAR_CLASSES = {
  DAY_CELL: 'h-10 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 rounded-lg p-1',
  SELECTED_DAY: 'bg-blue-500 text-white hover:bg-blue-600',
  TODAY: 'font-bold',
  WEEK_HEADER: 'h-5 w-8 flex items-center justify-center font-semibold text-gray-500 text-xs',
  WEEKDAY_HEADER: 'h-5 flex items-center justify-center font-semibold text-xs',
  SCHEDULE_ITEM: 'bg-blue-100 text-blue-800 rounded px-1 mb-1 truncate text-xs'
} as const;