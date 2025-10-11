"use client";

import { useSelector } from 'react-redux';
import { ThemeStateType } from '@components/theme/theme_color';
import { getThemeState } from "@utils/store/slices/mainThemeSlice";
import { defaultTheme } from '@components/theme/theme_color';

export enum ButtonSize {
  mini,
  normal,
  full
};

export enum ButtonType {
  dark,
  normal,
  light,
};

export type ButtonProps = {
  size? : ButtonSize,
  type? : ButtonType,
  onClick? : () => void,
  style? : {},
  disable? : boolean,
  text? : string,
};

function getButtonColor(props: ButtonProps, curTheme: ThemeStateType) {

  let light = defaultTheme.themeColor.Light;
  let dark = defaultTheme.themeColor.Dark;
  let theme1 = defaultTheme.themeColor.Theme1;
  let theme2 = defaultTheme.themeColor.Theme2;
  let theme3 = defaultTheme.themeColor.Theme3;
  if (
    curTheme &&
    curTheme.themeColor &&
    curTheme.themeColor.Light &&
    curTheme.themeColor.Dark &&
    curTheme.themeColor.Theme1 &&
    curTheme.themeColor.Theme2 &&
    curTheme.themeColor.Theme3
  ) {
    light = curTheme.themeColor.Light;
    dark = curTheme.themeColor.Dark;
    theme1 = curTheme.themeColor.Theme1;
    theme2 = curTheme.themeColor.Theme2;
    theme3 = curTheme.themeColor.Theme3;
  }

  if (props.type === ButtonType.dark) {
    return {color : light, backgroundColor : theme1};
  }
  else if (props.type === ButtonType.light) {
    return {color : dark, backgroundColor : theme3};
  }
  return {color : dark, backgroundColor : theme2};
};

function getButtonSize(props: ButtonProps) {
  if (props.size === ButtonSize.mini) {
    return {width : "auto", height: "20px"};
  } else if (props.size === ButtonSize.full) {
    return {width : "100%", height: "40px"};
  }
  return {width: "auto", height: "40px", padding: "10px"};
};

const defaultButton :ButtonProps = {
  size : ButtonSize.normal,
  type : ButtonType.normal,
  onClick : function(){console.log("button click!")},
  style : {},
  disable : false,
  text : "클릭",
};

export default function AwesomeButtonClient (props : ButtonProps
) {

  props = props || defaultButton;
  const buttonSizeStyle = getButtonSize(props);

  // useSelector를 항상 호출하되, 결과가 없으면 기본값 사용
  const currentTheme = useSelector(getThemeState) || defaultTheme;

  const buttonColorStyle = getButtonColor(props, currentTheme);

  return (
      <button
        className="flex items-center justify-center"
        style={{...props.style,
                ...buttonSizeStyle,
                ...buttonColorStyle,
                borderRadius: "10px",
                }}
        disabled={props.disable}
        onClick={() => props.onClick && props.onClick()}
        >
          {props.text}
      </button>
  );
};
