"use client";

import AwesomeButton, { ButtonSize, ButtonType } from "@components/button/AwesomeButton";
import Image from "next/image";
import Link from 'next/link';
import ClientOnly from "@components/common/ClientOnly";
import { useSelector } from "react-redux";
import { getThemeColor } from "@utils/store/slices/mainThemeSlice";
import { defaultTheme } from '@components/theme/theme_color';

// Redux가 필요한 컴포넌트를 분리
function HomeContent() {
  const themeColors = useSelector(getThemeColor);

  const colors = {
    background: themeColors.Light,
    text: themeColors.Dark,
    primary: themeColors.Theme1,
    accent: themeColors.Theme3
  };

  return (
    <main className="flex flex-col items-center justify-between p-4 h-full transition-colors duration-300"
          style={{ backgroundColor: colors.background, color: colors.text }}>
        <h1 className="text-3xl font-bold mb-8"
            style={{ color: colors.text }}>
          J-planner Home
        </h1>
        <div className="p-8 border-solid border-2 rounded-lg transition-colors duration-300"
            style={{
              width: "300px",
              borderColor: colors.primary,
              backgroundColor: colors.accent
            }}>
          <Link href={"calender"}>
            <div className="flex flex-col items-center justify-center gap-4" >
              <Image
                  src="example/vercel.svg"
                  alt="Vercel Logo"
                  // className="dark:invert"
                  width={100}
                  height={24}
                  // priority
                  />
              <AwesomeButton
                size={ButtonSize.normal}
                type={ButtonType.normal}
                text="달력으로 가기"
                />
            </div>
          </Link>
        </div>
    </main>
  );
}

export default function Home() {
  return (
    <ClientOnly
      fallback={
        <main className="flex flex-col items-center justify-between p-4 h-full"
              style={{ backgroundColor: defaultTheme.themeColor.Light, color: defaultTheme.themeColor.Dark }}>
          <h1 className="text-3xl font-bold mb-8">
            J-planner Home
          </h1>
          <div className="p-8 border-solid border-2 rounded-lg"
                style={{
                  width: "300px",
                  borderColor: defaultTheme.themeColor.Theme2,
                  backgroundColor: defaultTheme.themeColor.Theme3
                }}>
            <div className="flex flex-col items-center justify-center gap-4">
              <div>로딩 중...</div>
            </div>
          </div>
        </main>
      }
    >
      <HomeContent />
    </ClientOnly>
  );
}

