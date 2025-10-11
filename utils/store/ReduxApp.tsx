"use client";

import ReduxProvider from "@utils/store/provider";
import MainLayout from "@components/layouts/main/MainLayout";

interface ReduxAppProps {
  children: React.ReactNode;
}

export default function ReduxApp({ children }: ReduxAppProps) {
  return (
    <ReduxProvider>
      <MainLayout>
        {children}
      </MainLayout>
    </ReduxProvider>
  );
}
