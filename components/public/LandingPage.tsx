import { themeButtonClass } from '@components/button/ThemeButton';

import PublicShell from './PublicShell';

/** 비로그인 메인 `/` (US-39 AC1, 06 SITE-01) — 소개 + [시작하기]·[로그인]·[둘러보기] */
export default function LandingPage() {
  return (
    <PublicShell showLogin={false}>
      <section className="flex flex-col items-center gap-4 py-12 text-center fold:py-20">
        <h1 className="text-2xl font-bold fold:text-3xl">일정과 할 일을 한눈에</h1>
        <p className="max-w-[480px] text-base text-tp-muted">시간표로 하루를 계획하고, Todo와 기록을 함께 관리해요.</p>
        <div className="mt-2 flex w-full max-w-[320px] flex-col gap-2 fold:w-auto fold:max-w-none fold:flex-row">
          <a href="/signup" className={`${themeButtonClass('primary', 'md')} fold:min-w-[120px]`}>
            시작하기
          </a>
          <a href="/login" className={`${themeButtonClass('secondary', 'md')} fold:min-w-[120px]`}>
            로그인
          </a>
          <a href="/demo" className={`${themeButtonClass('secondary', 'md')} fold:min-w-[120px]`}>
            둘러보기
          </a>
        </div>
        <a href="/about" className="text-[13px] text-tp-muted underline underline-offset-2">
          어떤 서비스인지 더 보기
        </a>
      </section>
    </PublicShell>
  );
}
