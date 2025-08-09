"use client";

import Link from 'next/link';
import AwesomeButton, { ButtonSize, ButtonType } from "@components/button/AwesomeButton";
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/utils/store/store';
import { toggleMenu } from '@utils/store/slices/mainMenuSlice';

export default function MainHeader() {
  const projectName = "J's Planner";
  const mainTheme = useSelector((state: RootState) => state.mainTheme);
  const dispatch = useDispatch();
  const getHeaderStyle = () => {
    const bgColor = mainTheme.dark ? mainTheme.themeColor.Dark : mainTheme.themeColor.Light;
    const textColor = mainTheme.dark ? mainTheme.themeColor.Light : mainTheme.themeColor.Dark;
    return {
      backgroundColor: bgColor,
      color: textColor
    };
  };

  const handleMenuClick = () => {
    console.log("handleMenuClick");
    dispatch(toggleMenu());
  };

  return (
    <div className="main-header" style={getHeaderStyle()}>
      <div className='p-2 flex items-center justify-between'>
        <Link href={"/"}>
          <h2 className="text-2xl font-bold">{projectName}</h2>
        </Link>
        <div className="flex gap-2 ml-auto">
          <AwesomeButton 
            size={ButtonSize.normal}
            type={ButtonType.light}
            text="Sign in"
          />
          <AwesomeButton 
            size={ButtonSize.normal}
            type={ButtonType.light}
            text="Sign up"
          />
          <AwesomeButton 
            size={ButtonSize.normal}
            type={ButtonType.light}
            text="메뉴"
            onClick={handleMenuClick}
          />
        </div>
      </div>
    </div>
  );
}
