import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MainLayout from "@components/layouts/main/layouts/MainLayout";
import ReduxProvider from "@utils/store/provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "J's Planner",
  description: "Describe your specific world",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <ReduxProvider>
          <MainLayout>
            {children}
          </MainLayout>
        </ReduxProvider>
      </body>
    </html>
  );
};
  
