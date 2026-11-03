import { themeButtonClass } from '@components/button/ThemeButton';

import PublicShell from './PublicShell';

/** 소개할 기능 — 지금 있는 기능만, 미출시 기능·확정 안 된 약속 없음 (06 SITE-04) */
const FEATURES: { name: string; text: string; sample: string[] }[] = [
  { name: '일정', text: '월간·주간·하루 달력에서 일정을 보고 바로 추가해요.', sample: ['10:00 팀 회의', '14:00 치과'] },
  { name: 'Todo', text: '그날 할 일을 한 상자에 모으고, 끝내면 체크해요.', sample: ['☐ 보고서 초안', '☑ 장보기'] },
  { name: '시간 배치', text: '할 일을 시간표에 놓아 하루를 미리 계획해요.', sample: ['09:00–10:00 보고서 초안'] },
  { name: 'D-Day', text: '기다리는 날까지 남은 날을 세어요.', sample: ['여행 D-12'] },
  { name: '일기', text: '하루를 짧게 기록해요.', sample: ['오늘은 계획대로 끝냈다.'] },
  { name: '메모', text: '떠오른 생각을 바로 적어 두어요.', sample: ['다음 주 준비물: 노트북 충전기'] },
];

/** 소개 `/about` (US-39, 06 SITE-04) — 기능 소개 + 합성 예시(CSS로 그린 가짜 데이터, '예시' 표시, #340 ⑤). 회원 API 없음 */
export default function AboutPage() {
  return (
    <PublicShell>
      <section className="flex flex-col gap-2 pt-4">
        <h1 className="text-2xl font-bold">J의 계획은 이런 서비스예요</h1>
        <p className="text-sm text-tp-muted">계획을 세우고 지키고 싶은 사람을 위한 달력·플래너예요.</p>
      </section>

      <div className="grid grid-cols-1 gap-3 fold:grid-cols-2 pc:grid-cols-3">
        {FEATURES.map((feature) => (
          <section key={feature.name} aria-labelledby={`about-${feature.name}`} className="flex flex-col gap-2 rounded-2xl border border-tp-line bg-white p-5 text-ink">
            <h2 id={`about-${feature.name}`} className="text-base font-bold">
              {feature.name}
            </h2>
            <p className="text-sm leading-relaxed">{feature.text}</p>
            <div className="mt-1 flex flex-col gap-1 rounded-lg border border-dashed border-tp-line bg-tp-bg p-3 text-[13px]">
              <span className="self-start rounded bg-tp-secondary px-1.5 py-0.5 text-[11px] font-medium text-tp-on-secondary">예시</span>
              {feature.sample.map((line) => (
                <span key={line} className="break-words">
                  {line}
                </span>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="flex flex-col gap-2 fold:flex-row fold:justify-center">
        <a href="/signup" className={themeButtonClass('primary', 'md')}>
          시작하기
        </a>
        <a href="/demo" className={themeButtonClass('secondary', 'md')}>
          둘러보기
        </a>
      </div>

      {/* 오픈소스 라이선스 — 글꼴 OFL 전문 (#342) */}
      <section aria-labelledby="about-licenses" className="flex flex-col gap-1 text-[13px] text-tp-muted">
        <h2 id="about-licenses" className="text-sm font-semibold text-tp-text">
          오픈소스 라이선스
        </h2>
        <p>
          글꼴: IBM Plex Sans KR 1.1.0 (© IBM Corp.) —{' '}
          <a href="/fonts/ibm-plex-sans-kr/1.1.0/LICENSE.txt" className="underline underline-offset-2">
            SIL Open Font License 1.1
          </a>
        </p>
      </section>
    </PublicShell>
  );
}
