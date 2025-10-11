export type ThemeStateType = {
  themeColor:ThemeColor,
  isDark:boolean;
}

export interface ThemeColor {
  ThemeName:string;
  ThemeCd:number;
  Dark:string;
  Theme1:string;
  Theme2:string;
  Theme3:string;
  Light:string;
};

export const greenColorTheme : ThemeColor = {
  ThemeName : 'greenColorTheme',
  ThemeCd : 1,
  Dark : "#243119",
  Theme1 : "#40543B",
  Theme2 : "#CCD5AE",
  Theme3 : "#E9EDC9",
  Light : "#FEFAE0"
};

export const brownColorTheme : ThemeColor = {
  ThemeName : 'brownColorTheme',
  ThemeCd : 2,
  Dark : "#332523",
  Theme1 : "#7F534B",
  Theme2 : "#D4A373",
  Theme3 : "#FAEDCD",
  Light : "#FEFAE0"
};

export const grayColorTheme : ThemeColor = {
  ThemeName : 'grayColorTheme',
  ThemeCd : 999,
  Dark : "#000000",
  Theme1 : "#474747",
  Theme2 : "#858585",
  Theme3 : "#CCCCCC",
  Light : "#FFFFFF"
};

export const defaultTheme:ThemeStateType = {
  themeColor: greenColorTheme, isDark: false 
};
