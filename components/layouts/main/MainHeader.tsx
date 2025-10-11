"use client";

import Link from 'next/link';
import AwesomeButton, { ButtonSize, ButtonType } from "@components/button/AwesomeButton";
import { useDispatch, useSelector } from 'react-redux';
import { toggleMenu } from '@utils/store/slices/mainMenuSlice';
import { getThemeColor } from '@utils/store/slices/mainThemeSlice';
import { LAYOUT_CONSTANTS } from '@components/layouts/main/constants/layout';

export default function MainHeader() {
  const projectName = "J's Planner";
  const dispatch = useDispatch();
  const themeColors = useSelector(getThemeColor);

  const colors = {
    surface: themeColors.Dark,
    textReverse: themeColors.Light
  };

  const handleMenuClick = () => {
    dispatch(toggleMenu());
  };

  return (
    <div
      className="main-header"
      style={{
        backgroundColor: colors.surface,
        color: colors.textReverse,
        height: `${LAYOUT_CONSTANTS.HEADER_HEIGHT_PX}px`
      }}
    >
      <div className='p-4 h-full flex items-center justify-between'>
        <Link href={"/"}>
          <h2 
            className="text-2xl font-bold" 
            style={{ color: colors.textReverse }}
          >
            {projectName}
          </h2>
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
