import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
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
