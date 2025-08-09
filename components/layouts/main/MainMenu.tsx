"use client";

import { useDispatch, useSelector } from "react-redux";
import { getMainMenuState } from "@utils/store/slices/mainMenuSlice";
import AwesomeButton, { ButtonSize, ButtonType } from "@components/button/AwesomeButton";
import { toggleMenu } from "@utils/store/slices/mainMenuSlice";

export default function MainMenu() {
  const menuState = useSelector(getMainMenuState);
  const dispatch = useDispatch();
  console.log("MainMenu isOpen : ", menuState);
  if (!menuState.isOpen) return null;

  const handleMenuClick = () => {
    console.log("handleMenuClick");
    dispatch(toggleMenu());
  };

  return (
    <div className="fixed top-0 right-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold mb-6">메뉴</h3>
          <AwesomeButton
            size={ButtonSize.mini}
            type={ButtonType.light}
            text="X"
            onClick={handleMenuClick}
          />
        </div>
        <nav className="space-y-4">
          <a href="#" className="block hover:text-blue-600">대시보드</a>
          <a href="#" className="block hover:text-blue-600">프로필</a>
          <a href="#" className="block hover:text-blue-600">설정</a>
        </nav>
      </div>
    </div>
  );
} 
