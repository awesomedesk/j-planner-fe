"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

import type { Settings, SettingsUpdateRequest } from '@/types/api';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import Icon from '@components/icons/LineIcon';
import SidebarItemsEditor from '@components/sidebar/SidebarItemsEditor';
import { saveSettingsQuietly, selectSettings, type SaveResult } from '@store/slices/settingsSlice';
import { useFocusTrap } from '@utils/hooks/useFocusTrap';
import { COLOR_THEMES, type ColorThemeCode } from '@utils/theme/theme_color';

interface CalendarSettingsPanelProps {
  /** panel = PC 사이드바 자리·태블릿 겹침 / screen = 모바일 전체 화면 (닫기 대신 뒤로) */
  variant: 'panel' | 'screen';
  /** ‹ 설정 및 계정으로 */
  onBack: () => void;
  /** × 닫기 · Esc (panel만. screen의 Esc는 뒤로) */
  onClose: () => void;
  /** 카테고리 관리 › → 기존 카테고리 관리 창 */
  onOpenCategories: () => void;
}

const STATUS: Record<Exclude<SaveResult, 'blocked'>, { text: string; error: boolean }> = {
  saved: { text: '저장했어요.', error: false },
  failed: { text: '저장하지 못해 이전 값으로 되돌렸어요. 다시 바꿔 주세요.', error: true },
};

const COLOR_THEME_LABEL: Record<ColorThemeCode, string> = { GREEN: '녹색', BROWN: '갈색', GRAY: '무채색' };

/**
 * CalendarSettingsPanel - 달력 설정 (US-26·27, #396 승인 3dbb81f · 규칙 v1.3·1.3.1)
 * 머리 ‹ 설정 및 계정으로 · 제목(열면 초점) · × 닫기(PC·태블릿만) → 안내 '바꾸면 바로 저장되고 달력에 적용돼요.' + 결과 줄
 * 항목: 주 시작 요일 · 처음 화면 · 시간 표시 · 시간표 칸(눈금선) · 다크 모드 · 색 테마 · 사이드바 섹션(섹션 편집과 같은 행) · 카테고리 관리 ›
 * 바꾸면 그 항목만 바로 저장(SET-05), 실패하면 값이 되돌아가고 결과 줄에 알린다. 둘러보기는 가입 안내(allowWrite)만
 */
export default function CalendarSettingsPanel({ variant, onBack, onClose, onOpenCategories }: CalendarSettingsPanelProps) {
  const dispatch = useAppDispatch();
  const settings = useAppSelector(selectSettings);
  const [status, setStatus] = useState<{ text: string; error: boolean } | null>(null);
  const containerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const name = useId();
  const isScreen = variant === 'screen';

  useFocusTrap(containerRef, isScreen);
  useEffect(() => titleRef.current?.focus(), []);

  // Esc: 패널은 닫기, 모바일 화면은 뒤로. 다른 창(카테고리 관리 등)이 떠 있으면 그 창이 먼저
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      const otherModal = Array.from(document.querySelectorAll('[aria-modal="true"], [role="alertdialog"]')).some(
        (el) => !containerRef.current?.contains(el) && el !== containerRef.current
      );
      if (otherModal) return;
      if (isScreen) onBack();
      else onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isScreen, onBack, onClose]);

  const save = async (patch: SettingsUpdateRequest) => {
    const result = await dispatch(saveSettingsQuietly(patch)).unwrap();
    setStatus(result === 'blocked' ? null : STATUS[result]);
  };

  const head = (
    <header className={`flex h-[52px] shrink-0 items-center gap-1 px-2 ${isScreen ? 'bg-tp-primary text-tp-on-primary' : 'border-b border-tp-line'}`}>
      <button type="button" aria-label="설정 및 계정으로" onClick={onBack} className="inline-flex h-11 w-11 items-center justify-center rounded-lg">
        <Icon name="chevronLeft" size={20} />
      </button>
      <h2 ref={titleRef} id={titleId} tabIndex={-1} className="flex-1 text-[17px] font-bold outline-none">
        달력 설정
      </h2>
      {!isScreen && (
        <button type="button" aria-label="달력 설정 닫기" onClick={onClose} className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-tp-muted hover:bg-tp-panel">
          <Icon name="close" size={18} />
        </button>
      )}
    </header>
  );

  const body = (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="flex flex-col gap-1">
        <p className="text-[13px] text-tp-muted">바꾸면 바로 저장되고 달력에 적용돼요.</p>
        <p role="status" aria-live="polite" className={`text-[13px] font-semibold empty:hidden ${status?.error ? 'text-danger' : 'text-tp-primary'}`}>
          {status?.text ?? ''}
        </p>
      </div>
      <Choices
        legend="주 시작 요일"
        name={`${name}-week`}
        value={settings.weekStartDay}
        options={[
          { value: 'SUN', label: '일요일' },
          { value: 'MON', label: '월요일' },
        ]}
        onChange={(weekStartDay) => void save({ weekStartDay })}
      />
      <Choices
        legend="처음 화면"
        name={`${name}-start`}
        vertical
        value={settings.startView}
        options={[
          { value: 'MONTH', label: '월간' },
          { value: 'WEEK', label: '주간' },
          { value: 'DAY', label: '일간' },
          { value: 'LAST', label: '마지막에 본 화면', note: '이 기기에서만' },
        ]}
        onChange={(startView) => void save({ startView })}
      />
      <Choices
        legend="시간 표시"
        name={`${name}-time`}
        value={settings.timeFormat}
        options={[
          { value: '24H', label: '24시간', note: '13:00' },
          { value: '12H', label: '12시간', note: '오후 1:00' },
        ]}
        onChange={(timeFormat) => void save({ timeFormat })}
      />
      <Choices
        legend="시간표 칸"
        legendNote="주·일간 눈금선 간격"
        name={`${name}-slot`}
        value={String(settings.slotMinutes)}
        options={[
          { value: '30', label: '30분' },
          { value: '60', label: '1시간' },
        ]}
        onChange={(slot) => void save({ slotMinutes: Number(slot) as Settings['slotMinutes'] })}
      />
      <label className="flex min-h-11 items-center justify-between gap-3 text-sm font-semibold">
        다크 모드
        <input
          type="checkbox"
          role="switch"
          checked={settings.darkMode}
          onChange={(event) => void save({ darkMode: event.target.checked })}
          className="h-5 w-9 accent-tp-primary"
        />
      </label>
      <Choices
        legend="색 테마"
        name={`${name}-theme`}
        value={settings.colorTheme}
        options={(Object.keys(COLOR_THEME_LABEL) as ColorThemeCode[]).map((code) => ({
          value: code,
          label: COLOR_THEME_LABEL[code],
          swatch: [COLOR_THEMES[code].Theme1, COLOR_THEMES[code].Theme2],
        }))}
        onChange={(colorTheme) => void save({ colorTheme })}
      />
      <section aria-labelledby={`${titleId}-side`} className="flex flex-col gap-2">
        <h3 id={`${titleId}-side`} className="text-sm font-bold">
          사이드바 섹션
        </h3>
        <p className="text-[13px] text-tp-muted">날짜 패널의 ‘섹션 편집’과 같은 설정이에요.</p>
        <SidebarItemsEditor items={settings.sidebarItems} onChange={(sidebarItems) => void save({ sidebarItems })} />
      </section>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={onOpenCategories}
        className="flex min-h-11 items-center justify-between rounded-xl border border-tp-line bg-tp-panel px-3 text-sm font-semibold"
      >
        카테고리 관리
        <span aria-hidden="true">›</span>
      </button>
    </div>
  );

  if (isScreen) {
    return (
      <section
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="fixed inset-0 z-[60] flex flex-col bg-tp-bg text-tp-text"
      >
        {head}
        {body}
      </section>
    );
  }
  return (
    <section ref={containerRef} aria-labelledby={titleId} className="flex h-full w-[330px] shrink-0 flex-col border-l border-tp-line bg-tp-bg text-tp-text wide:w-[360px]">
      {head}
      {body}
    </section>
  );
}

interface ChoicesProps<T extends string> {
  legend: string;
  legendNote?: string;
  name: string;
  value: T;
  options: { value: T; label: string; note?: string; swatch?: [string, string] }[];
  vertical?: boolean;
  onChange: (value: T) => void;
}

/** 둘~넷 중 하나 고르기 (나란히 선택 버튼 / 처음 화면은 세로 목록, v1.3) */
function Choices<T extends string>({ legend, legendNote, name, value, options, vertical = false, onChange }: ChoicesProps<T>) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-bold">
        {legend}
        {legendNote && ' '}
        {legendNote && <small className="text-xs font-medium text-tp-muted">{legendNote}</small>}
      </legend>
      <div className={vertical ? 'flex flex-col gap-1' : 'grid auto-cols-fr grid-flow-col gap-1.5'}>
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm ${
              option.value === value ? 'border-tp-primary bg-tp-panel font-bold' : 'border-tp-line font-medium'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
              className="accent-tp-primary"
            />
            {option.swatch && <Swatch colors={option.swatch} />}
            {option.label}
            {option.note && ' '}
            {option.note && <small className="text-xs font-normal text-tp-muted">{option.note}</small>}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function Swatch({ colors }: { colors: [string, string] }): ReactNode {
  // 테마 미리보기 색 (데이터 색이라 인라인, CLAUDE.md 테마 규칙)
  return (
    <span aria-hidden="true" className="inline-flex h-4 w-6 overflow-hidden rounded">
      <span className="flex-1" style={{ backgroundColor: colors[0] }} />
      <span className="flex-1" style={{ backgroundColor: colors[1] }} />
    </span>
  );
}
