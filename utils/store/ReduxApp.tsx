"use client";

import ReduxProvider from "@utils/store/provider";

interface ReduxAppProps {
  children: React.ReactNode;
}

export default function ReduxApp({ children }: ReduxAppProps) {
  return <ReduxProvider>{children}</ReduxProvider>;
}
