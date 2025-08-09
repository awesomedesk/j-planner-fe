"use client";

import MainHeader from "./MainHeader";
import MainFooter from './MainFooter';
import MainMenu from "./MainMenu";
import { useSelector } from 'react-redux';
import { RootState } from '@/utils/store/store';

interface MainLayoutProps {
  title?:string,
  children?:any
}

export default function MainLayout(props: MainLayoutProps) {
  const isMenuOpen = useSelector((state: RootState) => state.mainMenu.isOpen);


  const {title, children} = props;
  return (
    <div className="min-h-screen flex">
      <div className={`main-content-box  ${isMenuOpen ? 'w-[calc(100%-16rem)]' : 'w-full'}`}>
        <MainHeader />
        <div className="flex">
          <main className={`transition-all duration-300 container mx-auto px-4 py-8`}>
            {children}
          </main>
        </div>
        <div>
          <MainFooter/>
        </div>
      </div>
      <div className={`main-menu-box ${isMenuOpen ? 'w-64' : 'w-0'}`}>
        <MainMenu />
      </div>
    </div>
  );
}

