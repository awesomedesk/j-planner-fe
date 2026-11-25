import { useEffect, type RefObject } from 'react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * 초점 가두기 (D-117, 06 대화창): 열려 있는 동안 Tab·Shift+Tab이 창 안에서 마지막 ↔ 첫 항목을 바로 돈다.
 * 창 안에 또 다른 모달(aria-modal, 예: 확인 창)이 떠 있으면 그 안에서만 돈다.
 * 처음 초점·Esc·닫힌 뒤 초점 복귀는 부르는 쪽이 정한다.
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const container = containerRef.current;
      if (!container) return;
      const nested = Array.from(container.querySelectorAll<HTMLElement>('[aria-modal="true"]')).at(-1);
      const scope = nested ?? container;
      const items = Array.from(scope.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const inside = scope.contains(active);
      if (event.shiftKey && (active === first || !inside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !inside)) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [containerRef, enabled]);
}
