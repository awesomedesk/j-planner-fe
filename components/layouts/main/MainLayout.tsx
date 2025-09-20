"use client";

import MainHeader from "@components/layouts/main/layouts/MainHeader";
import MainFooter from '@components/layouts/main/layouts/MainFooter';
import MainMenu from "@components/layouts/main/layouts/MainMenu";
import { useSelector } from 'react-redux';
import { RootState } from '@/utils/store/store';
import { getThemeState } from '@utils/store/slices/mainThemeSlice';

interface MainLayoutProps {
  title?:string,
  children?:any
}

export default function MainLayout(props: MainLayoutProps) {

  const currentTheme = useSelector(getThemeState);
  const isMenuOpen = useSelector((state: RootState) => state.mainMenu.isOpen);


  const {title, children} = props;
  return (
    <div className="flex"
            style={{ backgroundColor: currentTheme.themeColor.Light }}>
      <div className={`main-box  ${isMenuOpen ? 'w-[calc(100%-16rem)]' : 'w-full'}`}>
        <MainHeader />
        <div 
          className="main-content flex"
        >
          <main className={`transition-all duration-300 w-full`}>
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

