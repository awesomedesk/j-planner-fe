"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import DiscardConfirm from './DiscardConfirm';

/**
 * 창이 아닌 화면 안 입력(모바일 일기 탭 MO-11)을 떠날 때의 "작성을 취소할까요?" (D-037)
 * - 입력하는 쪽: useGuardWhileDirty(isDirty)
 * - 떠나게 하는 쪽(날짜 < >·오늘·보기·탭 바꾸기): guard(() => 실제 이동). 바뀐 것이 있으면 확인부터
 * Provider가 없으면 guard는 바로 실행한다
 */
interface LeaveGuardValue {
  setDirty: (dirty: boolean) => void;
  guard: (action: () => void) => void;
}

const LeaveGuardContext = createContext<LeaveGuardValue>({ setDirty: () => undefined, guard: (action) => action() });
export const useLeaveGuard = () => useContext(LeaveGuardContext);

export function LeaveGuardProvider({ children }: { children: ReactNode }) {
  const dirtyRef = useRef(false);
  const [pending, setPending] = useState<{ action: () => void } | null>(null);

  const setDirty = useCallback((dirty: boolean) => {
    dirtyRef.current = dirty;
  }, []);
  const guard = useCallback((action: () => void) => {
    if (dirtyRef.current) setPending({ action });
    else action();
  }, []);
  const value = useMemo(() => ({ setDirty, guard }), [setDirty, guard]);

  useEffect(() => {
    if (!pending) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPending(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pending]);

  return (
    <LeaveGuardContext.Provider value={value}>
      {children}
      {pending && (
        <DiscardConfirm
          onKeepEditing={() => setPending(null)}
          onDiscard={() => {
            dirtyRef.current = false;
            setPending(null);
            pending.action();
          }}
        />
      )}
    </LeaveGuardContext.Provider>
  );
}

/** 바뀐 내용이 있는 동안 떠나기 전 확인을 켠다. 화면이 사라지면 끈다 */
export function useGuardWhileDirty(isDirty: boolean) {
  const { setDirty } = useLeaveGuard();
  useEffect(() => {
    setDirty(isDirty);
    return () => setDirty(false);
  }, [isDirty, setDirty]);
}
