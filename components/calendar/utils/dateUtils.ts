const calculateRequiredWeeks = (viewDate: Date): number => {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  
  // First day of the month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // Calculate the start date (Sunday of the week containing the first day)
  const startDate = new Date(firstDay);
  startDate.setDate(firstDay.getDate() - firstDay.getDay());
  
  // Calculate how many weeks we need by checking if last day fits in existing weeks
  let weeks = 4; // Start with minimum 4 weeks
  let checkDate = new Date(startDate);
  checkDate.setDate(startDate.getDate() + (weeks * 7) - 1); // Last day of 4th week
  
  // If last day of month is after the 4th week, we need more weeks
  while (checkDate < lastDay && weeks < 6) {
    weeks++;
    checkDate.setDate(startDate.getDate() + (weeks * 7) - 1);
  }
  
  return weeks;
};

export const generateCalendarDays = (viewDate: Date) => {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // First day of the month
  const firstDay = new Date(year, month, 1);

  // Start from Sunday of the week containing the first day
  const startDate = new Date(firstDay);
  const dayOfWeek = firstDay.getDay();
  startDate.setDate(firstDay.getDate() - dayOfWeek);

  // Calculate required number of weeks
  const requiredWeeks = calculateRequiredWeeks(viewDate);
  
  // Generate dynamic number of weeks
  const days = [];
  const weekNumbers = [];
  
  for (let week = 0; week < requiredWeeks; week++) {
    // Calculate week number
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() + (week * 7));
    
    // Simple week number calculation
    const jan1 = new Date(weekStart.getFullYear(), 0, 1);
    const weekNum = Math.ceil(((weekStart.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
    weekNumbers.push(weekNum);
    
    const weekDays = [];
    for (let day = 0; day < 7; day++) {
      const currentDay = new Date(startDate);
      currentDay.setDate(startDate.getDate() + (week * 7) + day);
      weekDays.push(currentDay);
    }
    days.push(weekDays);
  }
  
  return { days, weekNumbers };
};

export const isDifferentMonth = (date: Date, viewDate: Date) => {
  return date.getMonth() !== viewDate.getMonth();
};

export const isSameDate = (date1: Date | null, date2: Date) => {
  return date1?.toDateString() === date2.toDateString();
};

/**
 * viewMode와 viewDate를 기반으로 조회 기간 계산
 * @param viewDate - 현재 보고 있는 날짜
 * @param viewMode - 보기 모드 (month, week, day)
 * @returns 시작일과 종료일
 */
export const getDateRange = (viewDate: Date, viewMode: 'month' | 'week' | 'day'): { start: Date; end: Date } => {
  if (viewMode === 'month') {
    // 월별보기: 해당 월의 1일 00:00:00 ~ 말일 23:59:59
    const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1, 0, 0, 0);
    const end = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0, 23, 59, 59);
    return { start, end };
  } else if (viewMode === 'week') {
    // 주별보기: 해당 주의 일요일 00:00:00 ~ 토요일 23:59:59
    const day = viewDate.getDay();
    const start = new Date(viewDate);
    start.setDate(viewDate.getDate() - day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  } else {
    // 일별보기: 해당 일의 00:00:00 ~ 23:59:59
    const start = new Date(viewDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(viewDate);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }
};

/**
 * 다음/이전 월로 이동 시 날짜 조정
 * 현재 일(day)을 유지하되, 해당 월에 없는 날짜면 마지막 날로 조정
 * 예: 1월 31일 → 2월로 이동 → 2월 28일 (윤년 아닐 때)
 */
export const getAdjustedMonth = (date: Date, monthOffset: number): Date => {
  const currentDay = date.getDate();
  const targetYear = date.getFullYear();
  const targetMonth = date.getMonth() + monthOffset;

  // 대상 월의 마지막 날 구하기
  const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

  // 현재 일이 대상 월에 존재하면 그대로, 없으면 마지막 날 사용
  const adjustedDay = Math.min(currentDay, lastDayOfTargetMonth);

  return new Date(targetYear, targetMonth, adjustedDay);
};
