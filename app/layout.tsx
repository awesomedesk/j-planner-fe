import { Inter } from "next/font/google";
import "./globals.css";
import ReduxApp from "@utils/store/ReduxApp";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "J's Planner",
  description: "MBTI J를 위한 플래너",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <ReduxApp>{children}</ReduxApp>
      </body>
    </html>
  );
}
