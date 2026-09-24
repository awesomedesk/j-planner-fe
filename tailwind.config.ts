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
