import { describe, expect, it } from 'vitest';

import { COLOR_THEMES, DEFAULT_COLOR_THEME, DEFAULT_DARK_MODE, resolveThemePalette } from './theme_color';

describe('테마 색 (US-02, D-024)', () => {
  it('기본값은 녹색·라이트', () => {
    expect(DEFAULT_COLOR_THEME).toBe('GREEN');
    expect(DEFAULT_DARK_MODE).toBe(false);
  });

  it('3종 색값이 06-screens 팔레트 표와 같다', () => {
    expect(COLOR_THEMES.GREEN).toMatchObject({ Dark: '#243119', Theme1: '#40543B', Theme2: '#CCD5AE', Theme3: '#E9EDC9', Light: '#FEFAE0' });
    expect(COLOR_THEMES.BROWN).toMatchObject({ Dark: '#332523', Theme1: '#7F534B', Theme2: '#D4A373', Theme3: '#FAEDCD', Light: '#FEFAE0' });
    expect(COLOR_THEMES.GRAY).toMatchObject({ Dark: '#000000', Theme1: '#474747', Theme2: '#858585', Theme3: '#CCCCCC', Light: '#FFFFFF' });
  });

  it('다크 모드: Dark↔Light, Theme1↔Theme3, Theme2 그대로', () => {
    expect(resolveThemePalette('GREEN', true)).toEqual({ Dark: '#FEFAE0', Theme1: '#E9EDC9', Theme2: '#CCD5AE', Theme3: '#40543B', Light: '#243119' });
  });
});
