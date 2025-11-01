import type { Schedule } from '../types';

/**
 * Test schedules for calendar development and testing
 * These are sample schedules to demonstrate calendar functionality
 */
export const testSchedules: Schedule[] = [
  {
    id: '1',
    title: '프로젝트 기획 회의',
    allDay: false,
    startDateTime: new Date(2025, 9, 1, 10, 0),
    endDateTime: new Date(2025, 9, 1, 12, 0),
    description: '새 프로젝트 기획안 논의',
    location: '회의실 A',
    color: '#3b82f6' // blue
  },
  {
    id: '2',
    title: '점심 약속',
    allDay: false,
    startDateTime: new Date(2025, 9, 1, 12, 30),
    endDateTime: new Date(2025, 9, 1, 14, 0),
    description: '김과장님과 점심식사',
    location: '강남역 맛집',
    color: '#8b5cf6' // purple
  },
  {
    id: '3',
    title: '개발팀 스프린트 리뷰',
    allDay: false,
    startDateTime: new Date(2025, 9, 1, 14, 0),
    endDateTime: new Date(2025, 9, 1, 16, 0),
    description: '이번 스프린트 성과 검토',
    location: '개발팀 회의실',
    color: '#a78bfa' // lightpurple
  },
  {
    id: '4',
    title: '의사 예약',
    allDay: false,
    startDateTime: new Date(2025, 9, 1, 15, 30),
    endDateTime: new Date(2025, 9, 1, 16, 30),
    description: '정기 건강검진',
    location: '서울대병원',
    color: '#ec4899' // pink
  },
  {
    id: '5',
    title: '휴가',
    allDay: true,
    startDateTime: new Date(2025, 9, 1, 0, 0),
    endDateTime: new Date(2025, 9, 3, 23, 59),
    description: '가족여행 - 제주도',
    color: '#3b82f6' // blue
  },
  {
    id: '6',
    title: '헬스장 PT',
    allDay: false,
    startDateTime: new Date(2025, 9, 1, 19, 0),
    endDateTime: new Date(2025, 9, 1, 20, 0),
    description: '개인 트레이닝 세션',
    location: '피트니스센터',
    color: '#8b5cf6' // purple
  }
];
