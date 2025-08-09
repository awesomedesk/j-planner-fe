"use client";

import { memo, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import AwesomeButton, { ButtonSize, ButtonType } from '@components/button/AwesomeButton';
import { getThemeState } from '@utils/store/slices/mainThemeSlice';
import { ScheduleManagerProps } from './types';
import { formatDateForDisplay, isSameDate } from './utils';

const ScheduleManager = memo(({ 
  selectedDate, 
  schedules, 
  onAddSchedule, 
  onDeleteSchedule 
}: ScheduleManagerProps) => {
  const [newScheduleTitle, setNewScheduleTitle] = useState('');
  const theme = useSelector(getThemeState);

  const selectedDateSchedules = schedules.filter(schedule => 
    isSameDate(schedule.date, selectedDate)
  );

  const handleAddSchedule = useCallback(() => {
    if (!newScheduleTitle.trim()) return;
    onAddSchedule(newScheduleTitle.trim());
    setNewScheduleTitle('');
  }, [newScheduleTitle, onAddSchedule]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddSchedule();
    }
  }, [handleAddSchedule]);

  const getContainerStyles = () => ({
    borderColor: theme.themeColor.Theme2,
    backgroundColor: theme.themeColor.Light
  });

  const getInputStyles = () => ({
    borderColor: theme.themeColor.Theme2,
    backgroundColor: theme.themeColor.Light,
    color: theme.themeColor.Dark
  });

  const getScheduleItemStyles = () => ({
    backgroundColor: theme.themeColor.Theme3,
    color: theme.themeColor.Dark
  });

  return (
    <div 
      className="mt-6 p-4 border rounded-lg"
      style={getContainerStyles()}
    >
      <h3 className="text-lg font-semibold mb-4" style={{ color: theme.themeColor.Dark }}>
        {formatDateForDisplay(selectedDate)} 일정
      </h3>
      
      <div className="flex gap-2">
        <input
          type="text"
          value={newScheduleTitle}
          onChange={(e) => setNewScheduleTitle(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="일정을 입력하세요"
          className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={getInputStyles()}
          maxLength={50}
        />
        <AwesomeButton
          size={ButtonSize.normal}
          type={ButtonType.normal}
          onClick={handleAddSchedule}
          text="추가"
          disable={!newScheduleTitle.trim()}
        />
      </div>
      
      <div className="mt-4 space-y-2">
        {selectedDateSchedules.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            일정이 없습니다.
          </p>
        ) : (
          selectedDateSchedules.map(schedule => (
            <div 
              key={schedule.id} 
              className="flex items-center justify-between p-3 rounded-lg shadow-sm"
              style={getScheduleItemStyles()}
            >
              <span className="flex-1 break-words">{schedule.title}</span>
              <AwesomeButton
                size={ButtonSize.mini}
                type={ButtonType.light}
                onClick={() => onDeleteSchedule(schedule.id)}
                text="삭제"
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
});

ScheduleManager.displayName = 'ScheduleManager';

export default ScheduleManager;