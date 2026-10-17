"use client";

import { useEffect, useState } from 'react';

import ScheduleFormDialog from '@components/schedule/form/ScheduleFormDialog';
import type { ScheduleFormTarget } from '@components/schedule/hooks/useScheduleForm';
import { toLocalDateString } from '@components/schedule/utils/scheduleFormUtils';
import type { Category, Schedule } from '@/types/api';

import { categoryApi, isApiError, scheduleApi } from '@utils/api';

/** 서버가 없을 때 화면만 확인하는 예시 데이터 */
const SAMPLE_CATEGORIES: Category[] = [
  { id: 1, name: '미지정', color: '#9E9E9E', isDefault: true, sortOrder: 0, scheduleCount: 0, todoCount: 0 },
  { id: 2, name: '업무', color: '#A6323F', isDefault: false, sortOrder: 1, scheduleCount: 0, todoCount: 0 },
  { id: 3, name: '공부', color: '#2F62A8', isDefault: false, sortOrder: 2, scheduleCount: 0, todoCount: 0 },
];

const SAMPLE_SCHEDULE: Schedule = {
  id: 1,
  title: '팀 미팅',
  allDay: false,
  start: '2026-09-24T10:00:00',
  end: '2026-09-24T11:00:00',
  categoryId: 2,
  color: '#5B5F97',
  description: '주간 진행 상황 공유',
  location: { name: '회의실 A', latitude: null, longitude: null },
  url: 'https://meet.example.com/team-weekly',
};

/**
 * 개발용: 일정 입력 창(OV-01, MO-08) 확인 페이지 — /dev/schedule-form
 * 달력 화면이 생기면 그쪽에서 열도록 옮기고 이 페이지는 지운다.
 */
export default function ScheduleFormDevPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryNotice, setCategoryNotice] = useState<string | null>(null);
  const [target, setTarget] = useState<ScheduleFormTarget | null>(null);
  const [scheduleId, setScheduleId] = useState('');
  const [log, setLog] = useState<string>('');

  useEffect(() => {
    categoryApi
      .getList()
      .then(setCategories)
      .catch((error) => {
        setCategories(SAMPLE_CATEGORIES);
        setCategoryNotice(`카테고리를 불러오지 못해 예시 데이터를 씁니다: ${isApiError(error) ? error.message : String(error)}`);
      });
  }, []);

  const openEditById = async () => {
    try {
      const schedule = await scheduleApi.getById(Number(scheduleId));
      setTarget({ mode: 'edit', schedule });
    } catch (error) {
      setLog(`불러오기 실패: ${isApiError(error) ? `${error.code} ${error.message}` : String(error)}`);
    }
  };

  const today = toLocalDateString(new Date());

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 p-6 text-sm">
      <h1 className="text-lg font-bold">개발용 · 일정 입력 창 (OV-01 / MO-08)</h1>
      {categoryNotice && <p className="text-amber-700">{categoryNotice}</p>}

      <div className="flex flex-wrap gap-2">
        <button className="rounded border px-3 py-2" onClick={() => setTarget({ mode: 'create', baseDate: today })}>
          새 일정 (오늘)
        </button>
        <button className="rounded border px-3 py-2" onClick={() => setTarget({ mode: 'create', baseDate: '2026-10-01', startTime: '14:00' })}>
          새 일정 (10/1 14:00, 빠른 추가에서 넘어온 경우)
        </button>
        <button className="rounded border px-3 py-2" onClick={() => setTarget({ mode: 'edit', schedule: SAMPLE_SCHEDULE })}>
          예시 일정 수정 (화면만)
        </button>
      </div>

      <div className="flex gap-2">
        <input
          className="w-32 rounded border px-2"
          placeholder="일정 id"
          value={scheduleId}
          onChange={(e) => setScheduleId(e.target.value)}
        />
        <button className="rounded border px-3 py-2" onClick={() => void openEditById()} disabled={!scheduleId}>
          서버에서 불러와 수정
        </button>
      </div>

      <pre className="whitespace-pre-wrap rounded bg-gray-100 p-3">{log || '저장·삭제 결과가 여기에 나옵니다.'}</pre>

      {target && (
        <ScheduleFormDialog
          key={target.mode === 'edit' ? `edit-${target.schedule.id}` : `create-${target.baseDate}-${target.startTime ?? ''}`}
          target={target}
          categories={categories}
          onClose={() => setTarget(null)}
          onSaved={(schedule) => {
            setLog(`저장됨\n${JSON.stringify(schedule, null, 2)}`);
            setTarget(null);
          }}
          onDeleted={(id) => {
            setLog(`삭제됨: id ${id}`);
            setTarget(null);
          }}
        />
      )}
    </main>
  );
}
