"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, MouseEvent } from 'react';

import type { Category, LocalDate, Schedule } from '@/types/api';
import ThemeButton from '@components/button/ThemeButton';
import DiscardConfirm from '@components/dialog/DiscardConfirm';
import CategorySelect from '@components/form/CategorySelect';
import { INPUT_CLASS } from '@components/form/formStyles';
import Icon from '@components/icons/LineIcon';

import { formatShortDay } from '@utils/date/dateUtils';
import { placePopover, type Rect } from '@utils/dom/placement';

import { useScheduleForm } from '../hooks/useScheduleForm';
import { TITLE_MAX_LENGTH, type ScheduleFormValues } from '../utils/scheduleFormUtils';

/** 임시 블록에 보여 줄 값 (D-017) */
export interface QuickAddPreview {
  title: string;
  startTime: string;
  endTime: string;
}

export interface QuickAddScheduleProps {
  /** PC·태블릿: 누른 시간 옆 팝업(PC-03) / 모바일: 아래 시트(MO-12) */
  variant: 'popover' | 'sheet';
  /** 누른 날 (바꿀 수 없음. 날짜를 바꾸려면 '자세히 입력') */
  date: LocalDate;
  /** 누른 칸 시작 `HH:mm` (30분 단위, D-053) */
  startTime: string;
  /** 길이 (분). 없으면 1시간. PC에서 끌어 만들면 그 길이 (D-053) */
  durationMinutes?: number;
  /** 임시 블록 손잡이·몸통을 끌어 바꾼 시간 (바뀔 때마다 시간 칸에 넣는다, D-053) */
  times?: Pick<ScheduleFormValues, 'startDate' | 'startTime' | 'endDate' | 'endTime'> | null;
  /** 누른 칸 자리 (팝업이 가리지 않게) */
  anchor?: Rect;
  categories: Category[];
  onClose: () => void;
  onSaved: (schedule: Schedule) => void;
  /** '자세히 입력' → 쓴 값을 일정 입력 창으로 */
  onOpenDetail: (values: ScheduleFormValues) => void;
  onPreviewChange: (preview: QuickAddPreview) => void;
  /** 입력한 것이 있는지 (다른 빈 시간을 누를 때 확인용, D-053 Q7) */
  onDirtyChange?: (isDirty: boolean) => void;
}

/** 크기 (화면기획서 PC-03 · MO-12) */
export const QUICK_ADD_POPOVER_WIDTH = 340;
export const QUICK_ADD_SHEET_HEIGHT = 300;
const POPOVER_HEIGHT_ESTIMATE = 300;
/** 좁은 자리라 시계 아이콘은 숨긴다 (눌러서 바로 입력) */
const TIME_INPUT_CLASS = `${INPUT_CLASS} min-w-0 flex-1 px-2 [&::-webkit-calendar-picker-indicator]:hidden`;

const usePopoverStyle = (variant: QuickAddScheduleProps['variant'], anchor: Rect | undefined) => {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(POPOVER_HEIGHT_ESTIMATE);
  useLayoutEffect(() => {
    if (ref.current?.offsetHeight) setHeight(ref.current.offsetHeight);
  }, []);

  if (variant === 'sheet' || !anchor) return { ref, style: variant === 'sheet' ? { height: QUICK_ADD_SHEET_HEIGHT } : undefined };
  const bounds = { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight };
  const { left, top } = placePopover(anchor, bounds, { width: QUICK_ADD_POPOVER_WIDTH, height });
  const style: CSSProperties = { left: `${left}px`, top: `${top}px`, width: QUICK_ADD_POPOVER_WIDTH };
  return { ref, style };
};

/**
 * QuickAddSchedule - 빈 시간을 눌러 일정 빠르게 추가 (US-10, D-017 · D-021)
 * - 제목·시간·카테고리만. 날짜는 누른 날로 고정, 나머지는 '자세히 입력'
 * - 저장 전까지 시간표에 점선 임시 블록 (onPreviewChange로 알려 준다)
 * - 바깥·Esc·닫기·취소: 입력한 것이 없으면 바로 닫고, 있으면 "작성을 취소할까요?" (D-037)
 * - Todo는 M2(US-13)에서 연결. 지금은 고르기만 막아 둔다
 */
export default function QuickAddSchedule({
  variant,
  date,
  startTime,
  durationMinutes,
  times,
  anchor,
  categories,
  onClose,
  onSaved,
  onOpenDetail,
  onPreviewChange,
  onDirtyChange,
}: QuickAddScheduleProps) {
  const [target] = useState(() => ({ mode: 'create' as const, baseDate: date, startTime, durationMinutes }));
  const form = useScheduleForm({ target, onSaved });
  const { values, errors } = form;
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const isSheet = variant === 'sheet';
  const { ref: panelRef, style } = usePopoverStyle(variant, anchor);

  const requestClose = useCallback(() => {
    if (form.isDirty) setIsConfirmOpen(true);
    else onClose();
  }, [form.isDirty, onClose]);

  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  const { setTimes } = form;
  useEffect(() => {
    if (times) setTimes(times);
  }, [times, setTimes]);

  useEffect(() => {
    onDirtyChange?.(form.isDirty);
  }, [onDirtyChange, form.isDirty]);

  /**
   * 바깥 누르기: 그 아래가 시간표 빈 칸이면 그 칸을 누른 것으로 넘긴다 (다른 빈 시간 → 팝업 옮기기, D-053 Q7).
   * 그 밖이면 닫기 요청
   */
  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    const backdrop = event.currentTarget;
    backdrop.style.pointerEvents = 'none';
    const below = document.elementFromPoint?.(event.clientX, event.clientY) ?? null;
    backdrop.style.pointerEvents = '';
    const slot = below?.closest('[data-quick-add-slot]');
    if (slot && !below?.closest('button, a')) {
      below?.dispatchEvent(new window.MouseEvent('click', { bubbles: true, clientX: event.clientX, clientY: event.clientY }));
      return;
    }
    requestClose();
  };

  useEffect(() => {
    onPreviewChange({ title: values.title, startTime: values.startTime, endTime: values.endTime });
  }, [onPreviewChange, values.title, values.startTime, values.endTime]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (isConfirmOpen) setIsConfirmOpen(false);
      else requestClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isConfirmOpen, requestClose]);

  return (
    <>
      {/* 바깥 누르기 = 닫기 요청 (빈 시간이면 그 칸으로 옮기기). 투명해서 시간표가 그대로 보이고, 임시 블록은 이 위에 있어 끌 수 있다 */}
      <div data-testid="quick-add-backdrop" className="fixed inset-0 z-40" aria-hidden="true" onClick={handleBackdropClick} />
      <div
        ref={panelRef}
        role="dialog"
        aria-label="빠른 추가"
        data-variant={variant}
        style={style}
        className={
          isSheet
            ? 'fixed inset-x-0 bottom-0 z-50 flex flex-col overflow-y-auto rounded-t-[18px] bg-white px-4 pb-4 pt-2 text-ink shadow-[0_-8px_24px_rgba(0,0,0,0.15)]'
            : 'fixed z-50 flex flex-col rounded-[14px] bg-white p-4 text-ink shadow-2xl'
        }
        {...(isSheet ? { 'data-swipe-ignore': true } : {})}
      >
        {isSheet && <div className="mx-auto mb-2 h-1 w-9 rounded-full bg-tp-line" aria-hidden="true" />}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-baseline gap-2 text-[15px] font-bold">
            빠른 추가
            {/* 모바일은 시간 줄이 좁아 날짜를 머리에 */}
            {isSheet && <span className="text-[13px] font-semibold text-tp-muted">{formatShortDay(date)}</span>}
          </h2>
          <button type="button" onClick={requestClose} aria-label="닫기" className="inline-flex h-8 w-8 items-center justify-center rounded-md">
            <Icon name="close" size={18} />
          </button>
        </div>

        <form
          noValidate
          className="flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            void form.handleSubmit();
          }}
        >
          {/* 일정 / Todo (Todo는 M2) */}
          <div className="flex gap-0.5 rounded-[10px] border border-tp-line bg-tp-panel p-[3px] text-[13px]">
            <button type="button" aria-pressed="true" className="flex-1 rounded-[7px] bg-tp-primary py-1.5 font-semibold text-tp-on-primary">
              일정
            </button>
            <button type="button" aria-pressed="false" disabled title="Todo는 다음 단계(M2)에서 열려요" className="flex-1 rounded-[7px] py-1.5 font-medium disabled:opacity-40">
              Todo
            </button>
          </div>

          <div className="flex flex-col gap-1">
            <input
              ref={titleInputRef}
              type="text"
              aria-label="제목"
              placeholder="제목"
              value={values.title}
              maxLength={TITLE_MAX_LENGTH}
              onChange={(e) => form.setField('title', e.target.value)}
              aria-invalid={Boolean(errors.title)}
              className={INPUT_CLASS}
            />
            <FieldError message={errors.title} />
          </div>

          <div className={isSheet ? 'flex items-center gap-2' : 'flex flex-col gap-3'}>
            <div className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
              {!isSheet && <span className="shrink-0 font-semibold">{formatShortDay(date)}</span>}
              <input
                type="time"
                aria-label="시작 시간"
                value={values.startTime}
                onChange={(e) => form.setStart(values.startDate, e.target.value)}
                aria-invalid={Boolean(errors.startTime)}
                className={TIME_INPUT_CLASS}
              />
              <span aria-hidden="true">–</span>
              <input
                type="time"
                aria-label="종료 시간"
                value={values.endTime}
                onChange={(e) => form.setField('endTime', e.target.value)}
                aria-invalid={Boolean(errors.endTime)}
                className={TIME_INPUT_CLASS}
              />
            </div>
            <CategorySelect
              ariaLabel="카테고리"
              categories={categories}
              value={values.categoryId}
              onChange={(categoryId) => form.setField('categoryId', categoryId)}
              className={isSheet ? 'w-[110px] shrink-0' : ''}
            />
          </div>
          <FieldError message={errors.startTime ?? errors.endTime ?? errors.endDate} />

          {form.formError && (
            <p role="alert" className="whitespace-pre-line text-sm text-danger">
              {form.formError}
            </p>
          )}

          <div className="mt-1 flex items-center justify-between gap-2">
            <button type="button" onClick={() => onOpenDetail(values)} className="text-[13px] font-semibold text-tp-primary underline-offset-2 hover:underline">
              자세히 입력
            </button>
            <div className="flex gap-2">
              {!isSheet && (
                <ThemeButton size="md" onClick={requestClose}>
                  취소
                </ThemeButton>
              )}
              <ThemeButton data-save-button size="md" variant="primary" type="submit" disabled={form.isSubmitting}>
                저장
              </ThemeButton>
            </div>
          </div>
        </form>
      </div>

      {isConfirmOpen && <DiscardConfirm onKeepEditing={() => setIsConfirmOpen(false)} onDiscard={onClose} />}
    </>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-danger">{message}</p>;
}
