import { MS_PER_DAY } from './constants';

export const getWeekNumber = (date: Date): number => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / MS_PER_DAY;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
};

export const isSameDate = (date1: Date | null, date2: Date): boolean => {
  if (!date1) return false;
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
};

export const isToday = (date: Date): boolean => {
  const today = new Date();
  return isSameDate(date, today);
};

export const getWeekdayClass = (dayOfWeek: number): string => {
  if (dayOfWeek === 0) return 'text-red-500'; // Sunday
  if (dayOfWeek === 6) return 'text-blue-500'; // Saturday
  return '';
};

export const formatDateForDisplay = (date: Date): string => {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
};