import { describe, expect, it } from 'vitest';

import { diaryPreview, isBlankDiary, validateDiaryContent } from './diaryUtils';

describe('일기 규칙 (US-24, 06 일기 창 · D-032)', () => {
  it('공백·줄바꿈만이면 빈 일기', () => {
    expect(isBlankDiary('  \n\t \n')).toBe(true);
    expect(isBlankDiary(' 오늘 ')).toBe(false);
  });

  it('검사: 빈 내용이면 "내용을 입력해 주세요."', () => {
    expect(validateDiaryContent('   \n')).toBe('내용을 입력해 주세요.');
    expect(validateDiaryContent('\n 오늘\n')).toBeNull();
  });

  it('사이드바 미리보기: 앞 3줄까지, 넘으면 잘렸다고 표시', () => {
    expect(diaryPreview('하나\n둘\n셋\n넷')).toEqual({ text: '하나\n둘\n셋', isCut: true });
    expect(diaryPreview('하나\n둘')).toEqual({ text: '하나\n둘', isCut: false });
  });
});
