"use client";

import { memo } from 'react';
import AwesomeButton, { ButtonSize, ButtonType } from '@components/button/AwesomeButton';
import { CalendarNavigationProps } from './types';
import { MONTHS_KR } from './constants';

const CalendarNavigation = memo(({ 
  currentDate, 
  onPrevMonth, 
  onNextMonth, 
  onViewTypeChange 
}: CalendarNavigationProps) => {
  return (
    <div className="flex p-4">
      <div className="flex gap-2 items-center">
        <AwesomeButton
          size={ButtonSize.normal}
          type={ButtonType.normal}
          onClick={onPrevMonth}
          text="<"
        />
        <h2 className="text-lg font-bold px-4">
          {currentDate.getFullYear()}년 {MONTHS_KR[currentDate.getMonth()]}
        </h2>
        <AwesomeButton
          size={ButtonSize.normal}
          type={ButtonType.normal}
          onClick={onNextMonth}
          text=">"
        />
      </div>
      <div className="flex ml-auto">
        <AwesomeButton
          size={ButtonSize.normal}
          type={ButtonType.normal}
          onClick={onViewTypeChange}
          text="월별보기"
        />
      </div>
    </div>
  );
});

CalendarNavigation.displayName = 'CalendarNavigation';

export default CalendarNavigation;