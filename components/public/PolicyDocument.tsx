import { formatEffectiveDate, pickPolicy, POLICY_PATH, POLICY_TITLE, type PolicyKind, type PolicyVersion } from '@utils/content/publicDocs';

interface PolicyDocumentProps {
  kind: PolicyKind;
  versions: readonly PolicyVersion[];
  /** 주소의 ?version= */
  version?: string | null;
}

/**
 * 이용약관·개인정보처리방침 본문 (US-39, 06 SITE-06·07) — 제목·시행일·목차·본문·이전 판.
 * 승인된 판이 없으면 제목과 '아직 공개 전이에요'만 (골격·TODO·가짜 조항을 게시하지 않음, #340 ①).
 * 회원 API를 부르지 않는다.
 */
export default function PolicyDocument({ kind, versions, version }: PolicyDocumentProps) {
  const title = POLICY_TITLE[kind];
  const current = pickPolicy(versions, version);

  if (!current) {
    return (
      <article className="flex flex-col gap-3 rounded-2xl border border-tp-line bg-white p-5 text-ink fold:p-8">
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-sm text-tp-muted">아직 공개 전이에요. 확정되면 이곳에 올려요.</p>
      </article>
    );
  }

  const others = versions.filter((v) => v.version !== current.version).reverse();

  return (
    <article className="flex flex-col gap-5 rounded-2xl border border-tp-line bg-white p-5 text-ink fold:p-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-xl font-bold">{title}</h1>
        <p className="text-[13px] text-tp-muted">시행일 {formatEffectiveDate(current.effectiveDate)}</p>
      </header>

      <nav aria-label="목차" className="rounded-xl bg-tp-bg p-4">
        <ol className="flex list-decimal flex-col gap-1 pl-5 text-sm">
          {current.sections.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`} className="underline-offset-2 hover:underline">
                {section.heading}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {current.sections.map((section) => (
        <section key={section.id} aria-labelledby={section.id} className="flex flex-col gap-2">
          <h2 id={section.id} className="scroll-mt-4 text-base font-bold">
            {section.heading}
          </h2>
          {section.body.map((paragraph, index) => (
            <p key={index} className="break-words text-sm leading-relaxed">
              {paragraph}
            </p>
          ))}
        </section>
      ))}

      {others.length > 0 && (
        <nav aria-label="이전 판" className="flex flex-col gap-1 border-t border-tp-line pt-4 text-[13px] text-tp-muted">
          <span>다른 판 보기</span>
          <ul className="flex flex-col gap-1">
            {others.map((v) => (
              <li key={v.version}>
                <a href={`${POLICY_PATH[kind]}?version=${v.version}`} className="underline underline-offset-2">
                  {formatEffectiveDate(v.effectiveDate)} 시행
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </article>
  );
}
