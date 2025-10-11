"use client";

import MainHeader from "@components/layouts/main/MainHeader";
import MainFooter from '@components/layouts/main/MainFooter';
import MainMenu from "@components/layouts/main/MainMenu";
import { useSelector } from 'react-redux';
import { RootState } from '@/utils/store/store';
import { getThemeState } from '@utils/store/slices/mainThemeSlice';

interface MainLayoutProps {
  title?:string,
  children?:any
}

export default function MainLayout(props: MainLayoutProps) {
  const {title, children} = props;
  const currentTheme = useSelector(getThemeState);
  const isMenuOpen = useSelector((state: RootState) => state.mainMenu.isOpen);

  return (
    <div className="flex transition-colors duration-300 min-h-screen"
            style={{ backgroundColor: currentTheme.themeColor.Light }}>
      <div className={`main-box transition-all duration-300 ${isMenuOpen ? 'w-[calc(100%-16rem)]' : 'w-full'}`}>
        <MainHeader />
        <div
          className="main-content flex transition-colors duration-300"
          style={{ backgroundColor: currentTheme.themeColor.Light }}
        >
          <main className={`transition-all duration-300 w-full`}
                style={{ backgroundColor: currentTheme.themeColor.Light }}>
            {children}
          </main>
        </div>
          <MainFooter/>
      </div>
      <div className={`main-menu-box ${isMenuOpen ? 'w-64' : 'w-0'}`}>
        <MainMenu />
      </div>
    </div>
  );
}

