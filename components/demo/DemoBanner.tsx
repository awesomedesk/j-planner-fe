import { themeButtonClass } from '@components/button/ThemeButton';

/** 둘러보기 상단 띠 (US-40, 06 SITE-08) — 계속 보이는 예시 안내 + [가입하기]·[로그인]. 좁은 화면에서도 줄바꿈으로 넘치지 않게 */
export default function DemoBanner() {
  return (
    <section
      aria-label="둘러보기 안내"
      className="flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-b border-tp-line bg-tp-secondary px-3 py-2 text-[13px] text-tp-on-secondary"
    >
      <p className="min-w-0 font-medium">예시 화면이에요. 입력한 내용은 저장되지 않아요.</p>
      <div className="flex shrink-0 gap-2">
        <a href="/signup" className={themeButtonClass('primary', 'sm')}>
          가입하기
        </a>
        <a href="/login" className={themeButtonClass('secondary', 'sm')}>
          로그인
        </a>
      </div>
    </section>
  );
}
