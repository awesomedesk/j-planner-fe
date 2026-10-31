import { useId, type ReactNode } from 'react';

/** 내 계정 카드 (06 SITE-09) — 제목이 이름인 영역. 성공 안내는 카드 안 role=status */
export function AccountCard({ title, danger = false, children }: { title: string; danger?: boolean; children: ReactNode }) {
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      className={`flex w-full flex-col gap-3 rounded-2xl border bg-white p-5 text-ink fold:p-6 ${danger ? 'border-danger-line' : 'border-tp-line'}`}
    >
      <h2 id={titleId} className="text-base font-bold">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** 카드 안 성공 안내 (화면 읽기에 알림) */
export function CardSuccess({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="status" className="text-[13px] text-success">
      {message}
    </p>
  );
}

/** 카드 안 설명 */
export function CardText({ children }: { children: ReactNode }) {
  return <p className="text-[13px] leading-relaxed text-tp-muted">{children}</p>;
}
