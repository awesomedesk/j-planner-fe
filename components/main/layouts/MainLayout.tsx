"use client";

import MainHeader from "@components/main/layouts/MainHeader";
import MainFooter from '@components/main/layouts/MainFooter';
import MainMenu from "@components/main/layouts/MainMenu";
import { useSelector } from 'react-redux';
import { RootState } from '@utils/store/store';

interface MainLayoutProps {
  title?:string,
  children?:any
}

export default function MainLayout(props: MainLayoutProps) {
  const isMenuOpen = useSelector((state: RootState) => state.mainMenu.isOpen);


  const {title, children} = props;
  return (
    <div className="flex">
      <div className={`main-content-box  ${isMenuOpen ? 'w-[calc(100%-14rem)]' : 'w-full'}`}>
        <MainHeader />
        <div className="flex">
          <main className={`transition-all duration-300 w-full`}>
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

