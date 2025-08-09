const calculateRequiredWeeks = (currentDate: Date): number => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
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

export const generateCalendarDays = (currentDate: Date) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // First day of the month
  const firstDay = new Date(year, month, 1);
  
  // Start from Sunday of the week containing the first day
  const startDate = new Date(firstDay);
  const dayOfWeek = firstDay.getDay();
  startDate.setDate(firstDay.getDate() - dayOfWeek);
  
  // Calculate required number of weeks
  const requiredWeeks = calculateRequiredWeeks(currentDate);
  
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

export const isDifferentMonth = (date: Date, currentDate: Date) => {
  return date.getMonth() !== currentDate.getMonth();
};

export const isSameDate = (date1: Date | null, date2: Date) => {
  return date1?.toDateString() === date2.toDateString();
};
