import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // 필터에서 빠진 카테고리로 저장했을 때 (D-056): 버튼 커짐 + 빛 고리, 저장한 줄 빛 고리. 번쩍임은 쓰지 않는다
      keyframes: {
        "reveal-scale": { "0%, 100%": { transform: "scale(1)" }, "45%": { transform: "scale(1.1)" } },
        "reveal-ring": {
          "0%": { boxShadow: "0 0 0 0 color-mix(in srgb, var(--tp-theme1) 55%, transparent)" },
          "100%": { boxShadow: "0 0 0 12px color-mix(in srgb, var(--tp-theme1) 0%, transparent)" },
        },
        "reveal-row-ring": {
          "0%": { boxShadow: "0 0 0 0 color-mix(in srgb, var(--tp-theme1) 55%, transparent)" },
          "100%": { boxShadow: "0 0 0 10px color-mix(in srgb, var(--tp-theme1) 0%, transparent)" },
        },
      },
      animation: {
        "reveal-pulse": "reveal-scale 0.32s ease-out 1, reveal-ring 0.6s ease-out 1",
        "reveal-ring": "reveal-row-ring 0.7s ease-out 1",
      },
      // 화면 폭 구분 (D-018). 600px 미만은 모바일(기본값)
      screens: {
        fold: "600px", // 폴드 펼침: 모바일 구성 + 오른쪽 패널
        tablet: "768px", // 태블릿 세로: 사이드바 닫힘으로 시작
        pc: "1024px", // PC
        wide: "1920px", // 달력만 넓어짐, 사이드바 360px 고정
      },
      // 테마 색 (US-02). 값은 CSS 변수라 테마·다크 모드를 바꾸면 따라 바뀐다 (components/theme/themeCssVariables.ts)
      colors: {
        tp: {
          dark: "var(--tp-dark)",
          theme1: "var(--tp-theme1)",
          theme2: "var(--tp-theme2)",
          theme3: "var(--tp-theme3)",
          light: "var(--tp-light)",
          /** 바탕 */
          bg: "var(--tp-light)",
          /** 글자 */
          text: "var(--tp-dark)",
          /** 보조 글자 */
          muted: "var(--tp-muted)",
          /** 카드·섹션 바탕 */
          panel: "var(--tp-panel)",
          /** 구분선·카드 테두리 */
          line: "var(--tp-line)",
          /** 주 버튼·헤더 (진한 테마색, D-022) */
          primary: "var(--tp-theme1)",
          "on-primary": "var(--tp-light)",
          /** 보조 버튼·드롭다운 (연한 테마색 바탕 + 진한 글자, D-022) */
          secondary: "var(--tp-theme3)",
          "secondary-line": "var(--tp-theme2)",
          "on-secondary": "var(--tp-theme1)",
        },
        /** 삭제·경고 */
        danger: "#B42318",
        /** 지난 미완료 Todo 줄 테두리 (연한 빨강, US-16) */
        "danger-line": "#F2B8B5",
        /** 흰 바탕(입력칸·말풍선) 위 글자 — 테마와 관계없이 같은 진한 색 */
        ink: "#26301F",
        /** 요일 글자색: 일요일 빨강, 토요일 파랑 (월간·모바일 주간) */
        sunday: "#A6323F",
        saturday: "#2F62A8",
        /** 켜고 끄는 스위치의 꺼짐 색 */
        "switch-off": "#BDB79B",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
