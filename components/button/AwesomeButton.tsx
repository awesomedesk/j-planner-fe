import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { defaultTheme } from '@components/theme/theme_color';

// 기존 types와 enums를 다시 export
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

function getButtonSize(props: ButtonProps) {
  if (props.size === ButtonSize.mini) {
    return {width : "auto", height: "20px"};
  } else if (props.size === ButtonSize.full) {
    return {width : "100%", height: "40px"};
  }
  return {width: "auto", height: "40px", padding: "10px"};
};

function getDefaultButtonStyle(props: ButtonProps) {
  const sizeStyle = getButtonSize(props);

  let backgroundColor = defaultTheme.themeColor.Theme2;
  let color = defaultTheme.themeColor.Dark;

  if (props.type === ButtonType.dark) {
    backgroundColor = defaultTheme.themeColor.Theme1;
    color = defaultTheme.themeColor.Light;
  } else if (props.type === ButtonType.light) {
    backgroundColor = defaultTheme.themeColor.Theme3;
    color = defaultTheme.themeColor.Dark;
  }

  return {
    ...sizeStyle,
    backgroundColor,
    color,
    borderRadius: "10px"
  };
}

// Dynamic import with SSR disabled
const AwesomeButtonClient = dynamic(() => import('./AwesomeButtonClient'), {
  ssr: false,
  loading: () => (
    <button
      className="flex items-center justify-center"
      disabled
    >
      Loading...
    </button>
  )
});

const defaultButton: ButtonProps = {
  size: ButtonSize.normal,
  type: ButtonType.normal,
  onClick: function(){console.log("button click!")},
  style: {},
  disable: false,
  text: "클릭",
};

export default function AwesomeButton(props: ButtonProps) {
  const [mounted, setMounted] = useState(false);
  const finalProps = { ...defaultButton, ...props };

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="flex items-center justify-center"
        style={{
          ...finalProps.style,
          ...getDefaultButtonStyle(finalProps)
        }}
        disabled={finalProps.disable}
      >
        {finalProps.text}
      </button>
    );
  }

  return <AwesomeButtonClient {...finalProps} />;
};

