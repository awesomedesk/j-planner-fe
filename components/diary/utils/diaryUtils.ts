/**
 * 일기 규칙 (US-24, 06 일기 · D-032)
 * 내용은 보낸 그대로 저장한다 — 앞뒤 공백·줄바꿈을 다듬지 않는다. 검사만 공백 기준
 */

export const DIARY_EMPTY_ERROR = '내용을 입력해 주세요.';
export const DIARY_TOO_LONG_ERROR = '일기가 너무 길어요. 조금 줄여서 저장해 주세요.';
/** 사이드바 미리보기 줄 수 */
export const DIARY_PREVIEW_LINES = 3;

export const isBlankDiary = (content: string) => content.trim() === '';

export const validateDiaryContent = (content: string): string | null => (isBlankDiary(content) ? DIARY_EMPTY_ERROR : null);

/** 앞 3줄 (넘으면 isCut) */
export const diaryPreview = (content: string) => {
  const lines = content.split('\n');
  return { text: lines.slice(0, DIARY_PREVIEW_LINES).join('\n'), isCut: lines.length > DIARY_PREVIEW_LINES };
};
