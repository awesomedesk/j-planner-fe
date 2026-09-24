import type { ButtonHTMLAttributes, ReactNode } from 'react';

/**
 * ThemeButton - 테마색 버튼 (D-022: 흰색 버튼 없음)
 *
 * - primary: 진한 테마색 바탕 (저장, 추가 등 주 동작)
 * - secondary: 연한 테마색 바탕 + 진한 글자 (그 외 버튼·드롭다운)
 * - danger: 바탕 없이 빨간 글자 (삭제)
 */
export type ThemeButtonVariant = 'primary' | 'secondary' | 'danger';
export type ThemeButtonSize = 'sm' | 'md';

interface ThemeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ThemeButtonVariant;
  size?: ThemeButtonSize;
  /** 아이콘만 있는 정사각 버튼. aria-label을 꼭 준다 */
  iconOnly?: boolean;
  children: ReactNode;
}

const VARIANT_CLASS: Record<ThemeButtonVariant, string> = {
  primary: 'border border-tp-primary bg-tp-primary text-tp-on-primary',
  secondary: 'border border-tp-secondary-line bg-tp-secondary text-tp-on-secondary',
  danger: 'border border-transparent bg-transparent text-danger',
};

const SIZE_CLASS: Record<ThemeButtonSize, { text: string; icon: string }> = {
  sm: { text: 'px-3 py-1.5 text-[13px]', icon: 'h-8 w-8' },
  md: { text: 'px-4 py-2 text-sm', icon: 'h-9 w-9' },
};

export default function ThemeButton({
  variant = 'secondary',
  size = 'sm',
  iconOnly = false,
  type = 'button',
  className = '',
  children,
  ...rest
}: ThemeButtonProps) {
  const sizeClass = iconOnly ? `${SIZE_CLASS[size].icon} justify-center p-0` : SIZE_CLASS[size].text;
  return (
    <button
      type={type}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg font-semibold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 ${VARIANT_CLASS[variant]} ${sizeClass} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
