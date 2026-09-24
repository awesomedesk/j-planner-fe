"use client";

import type { Category, HexColor } from '@/types/api';
import ThemeButton from '@components/button/ThemeButton';
import DialogFrame, { useDialogRequestClose } from '@components/dialog/DialogFrame';
import Icon from '@components/icons/LineIcon';
import { ITEM_COLOR_OPTIONS } from '@components/theme/itemColorOptions';

import { useCategoryManager } from './hooks/useCategoryManager';
import { CATEGORY_NAME_MAX_LENGTH, DEFAULT_CATEGORY_COLOR, getCategoryListColor, getMoveAfterId } from './utils/categoryUtils';

interface CategoryManagerDialogProps {
  onClose: () => void;
}

/**
 * CategoryManagerDialog - 카테고리 관리 창 (US-04)
 * - 600px 이상: 가운데 창 (OV-04). 줄마다 수정·삭제·▲▼
 * - 600px 미만: 전체 화면 (MO-21). 줄에는 수정·▲▼, 삭제는 '수정' 안에서
 * 여는 곳: 카테고리 필터 드롭다운 맨 아래(US-11), 설정(US-26), 모바일 메뉴(US-28)
 */
export default function CategoryManagerDialog({ onClose }: CategoryManagerDialogProps) {
  const manager = useCategoryManager();
  const { categories } = manager;

  return (
    <DialogFrame title="카테고리 관리" onClose={onClose} isDirty={manager.isDirty} footer={<ManagerFooter />}>
      <p className="hidden text-[13px] leading-relaxed text-tp-muted fold:block">
        일정과 Todo가 함께 쓰는 꼬리표입니다. 블록 왼쪽 띠는 카테고리 색, 몸통은 항목마다 고른 색(안 고르면 테마색)입니다.
      </p>

      <ul className="flex flex-col gap-2" aria-label="카테고리 목록">
        {categories.map((category) => (
          <li key={category.id}>
            {category.isDefault ? (
              <DefaultCategoryRow category={category} />
            ) : manager.editingId === category.id ? (
              <EditingRow category={category} manager={manager} />
            ) : (
              <CategoryRow category={category} manager={manager} />
            )}
          </li>
        ))}
      </ul>
      {categories.length > 1 && (
        <p className="hidden text-right text-xs text-tp-muted fold:block">▲▼로 순서 변경. 이 순서가 필터 드롭다운·입력 창 목록 순서</p>
      )}

      <form
        className="flex flex-col gap-2 max-fold:rounded-xl max-fold:border max-fold:border-tp-line max-fold:bg-tp-panel max-fold:p-2.5"
        onSubmit={(event) => {
          event.preventDefault();
          void manager.addCategory();
        }}
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={manager.newName}
            onChange={(e) => manager.changeNewName(e.target.value)}
            placeholder="새 카테고리 이름"
            aria-label="새 카테고리 이름"
            maxLength={CATEGORY_NAME_MAX_LENGTH}
            aria-invalid={Boolean(manager.addError)}
            aria-describedby={manager.addError ? 'category-add-error' : undefined}
            className="min-w-0 flex-1 rounded-lg border border-tp-line bg-white px-3 py-2.5 text-sm text-[#26301F] outline-none focus:ring-2 focus:ring-tp-theme2"
          />
          <ThemeButton type="submit" variant="primary" size="md" disabled={manager.busyId === 'new'}>
            <Icon name="plus" className="hidden fold:block" />
            <span>추가</span>
          </ThemeButton>
        </div>
        {/* 고른 색을 다시 누르면 선택 해제 → 선택 없음(기본색) (D-039) */}
        <ColorPicker label="새 카테고리 색 (고르지 않으면 기본색)" value={manager.newColor} onChange={manager.setNewColor} allowDeselect />
        {manager.addError && (
          <p id="category-add-error" className="text-xs text-danger">
            {manager.addError}
          </p>
        )}
      </form>
    </DialogFrame>
  );
}

type Manager = ReturnType<typeof useCategoryManager>;

const ROW_CLASS = 'flex min-h-[46px] items-center gap-2 rounded-[10px] border border-tp-line px-2.5 py-2 fold:gap-2.5 fold:px-3';

function ManagerFooter() {
  const requestClose = useDialogRequestClose();
  return (
    <>
      <span className="text-xs text-tp-muted">삭제하면 연결된 일정·Todo는 미지정으로 이동</span>
      <ThemeButton size="md" onClick={requestClose}>
        닫기
      </ThemeButton>
    </>
  );
}

function ColorDot({ color }: { color: HexColor }) {
  return <span className="h-4 w-4 shrink-0 rounded-full fold:h-[18px] fold:w-[18px]" style={{ backgroundColor: color }} aria-hidden="true" />;
}

function NameAndCount({ category }: { category: Category }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col fold:flex-row fold:items-center fold:gap-2.5">
      <span className="min-w-0 flex-1 truncate text-sm font-semibold" title={category.name}>
        {category.name}
      </span>
      <span className="whitespace-nowrap text-[11px] text-tp-muted fold:text-xs">
        일정 {category.scheduleCount} · Todo {category.todoCount}
      </span>
    </div>
  );
}

function DefaultCategoryRow({ category }: { category: Category }) {
  return (
    <div className={`${ROW_CLASS} bg-tp-panel`}>
      <ColorDot color={getCategoryListColor(category)} />
      <NameAndCount category={category} />
      <span className="shrink-0 whitespace-nowrap rounded-full border border-tp-secondary-line bg-tp-bg px-1.5 py-0.5 text-[10px] font-bold text-tp-on-secondary fold:px-2 fold:text-[11px]">
        기본 · 맨 위 고정
      </span>
    </div>
  );
}

function CategoryRow({ category, manager }: { category: Category; manager: Manager }) {
  const isBusy = manager.busyId === category.id;
  const canMoveUp = getMoveAfterId(manager.categories, category.id, 'up') !== undefined;
  const canMoveDown = getMoveAfterId(manager.categories, category.id, 'down') !== undefined;

  if (manager.deleteConfirmId === category.id) {
    return (
      <div className={`${ROW_CLASS} flex-wrap bg-tp-bg`}>
        <ColorDot color={getCategoryListColor(category)} />
        <span className="min-w-0 flex-1 text-sm">
          <b className="font-semibold">{category.name}</b>을(를) 지울까요? 일정 {category.scheduleCount} · Todo {category.todoCount}은 미지정으로
          옮겨져요
        </span>
        <div className="flex gap-1.5">
          <ThemeButton variant="danger" onClick={() => void manager.deleteCategory(category)} disabled={isBusy}>
            확인
          </ThemeButton>
          <ThemeButton onClick={manager.cancelDelete}>취소</ThemeButton>
        </div>
      </div>
    );
  }

  return (
    <div className={`${ROW_CLASS} bg-tp-bg`}>
      <ColorDot color={getCategoryListColor(category)} />
      <NameAndCount category={category} />
      <ThemeButton onClick={() => manager.startEdit(category)} disabled={isBusy}>
        수정
      </ThemeButton>
      <ThemeButton
        variant="danger"
        className="hidden px-1.5 fold:inline-flex"
        onClick={() => void manager.deleteCategory(category)}
        disabled={isBusy}
      >
        삭제
      </ThemeButton>
      <span className="inline-flex gap-0.5">
        <ThemeButton
          iconOnly
          className="!h-7 !w-7"
          aria-label={`${category.name} 위로`}
          disabled={!canMoveUp || isBusy}
          onClick={() => void manager.moveCategory(category, 'up')}
        >
          <Icon name="chevronUp" size={14} strokeWidth={2.4} />
        </ThemeButton>
        <ThemeButton
          iconOnly
          className="!h-7 !w-7"
          aria-label={`${category.name} 아래로`}
          disabled={!canMoveDown || isBusy}
          onClick={() => void manager.moveCategory(category, 'down')}
        >
          <Icon name="chevronDown" size={14} strokeWidth={2.4} />
        </ThemeButton>
      </span>
    </div>
  );
}

function EditingRow({ category, manager }: { category: Category; manager: Manager }) {
  const isBusy = manager.busyId === category.id;
  return (
    <form
      className={`${ROW_CLASS} flex-col items-stretch bg-tp-bg`}
      onSubmit={(event) => {
        event.preventDefault();
        void manager.saveEdit();
      }}
    >
      <div className="flex items-center gap-2">
        <ColorDot color={manager.editColor ?? DEFAULT_CATEGORY_COLOR} />
        <input
          type="text"
          value={manager.editName}
          onChange={(e) => manager.changeEditName(e.target.value)}
          aria-label="카테고리 이름"
          maxLength={CATEGORY_NAME_MAX_LENGTH}
          autoFocus
          aria-invalid={Boolean(manager.editError)}
          className="min-w-0 flex-1 rounded-lg border border-tp-line bg-white px-3 py-2 text-sm text-[#26301F] outline-none focus:ring-2 focus:ring-tp-theme2"
        />
        <ThemeButton type="submit" variant="primary" disabled={isBusy}>
          저장
        </ThemeButton>
        <ThemeButton onClick={manager.cancelEdit}>취소</ThemeButton>
      </div>
      <ColorPicker label="카테고리 색" value={manager.editColor} onChange={manager.setEditColor} />
      {manager.editError && <p className="text-xs text-danger">{manager.editError}</p>}
      {/* 모바일: 줄에 삭제 버튼이 없어서 수정 안에서 지운다 (MO-21) */}
      <ThemeButton
        variant="danger"
        className="self-start px-0 fold:hidden"
        onClick={() => void manager.deleteCategory(category)}
        disabled={isBusy}
      >
        카테고리 삭제
      </ThemeButton>
    </form>
  );
}

interface ColorPickerProps {
  label: string;
  /** null = 아무것도 고르지 않음 */
  value: HexColor | null;
  onChange: (color: HexColor | null) => void;
  /** 고른 색을 다시 누르면 선택 해제(null) */
  allowDeselect?: boolean;
}

function ColorPicker({ label, value, onChange, allowDeselect = false }: ColorPickerProps) {
  return (
    <div role={allowDeselect ? 'group' : 'radiogroup'} aria-label={label} className="flex flex-wrap items-center gap-2.5 py-1">
      {ITEM_COLOR_OPTIONS.map((color) => {
        const isSelected = value !== null && color.toUpperCase() === value.toUpperCase();
        return (
          <button
            key={color}
            type="button"
            role={allowDeselect ? undefined : 'radio'}
            aria-checked={allowDeselect ? undefined : isSelected}
            aria-pressed={allowDeselect ? isSelected : undefined}
            aria-label={`색 ${color}`}
            onClick={() => onChange(isSelected && allowDeselect ? null : color)}
            className="h-[26px] w-[26px] rounded-full fold:h-6 fold:w-6"
            style={{ backgroundColor: color, boxShadow: isSelected ? `0 0 0 2px #FFFFFF, 0 0 0 4px ${color}` : undefined }}
          />
        );
      })}
    </div>
  );
}
