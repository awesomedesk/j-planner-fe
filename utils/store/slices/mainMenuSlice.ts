import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '@utils/store/store';

interface MainMenuState {
  isOpen: boolean;
}

const initialState: MainMenuState = {
  isOpen: false,
};

const mainMenuSlice = createSlice({
  name: 'mainMenu',
  initialState:initialState,
  reducers: {
    toggleMenu: (state) => {
      state.isOpen = !state.isOpen;
    },
    setMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.isOpen = action.payload;
    },
  },
});

export const { toggleMenu, setMenuOpen } = mainMenuSlice.actions;
export const getMainMenuState = (state:RootState) => state.mainMenu;
export default mainMenuSlice.reducer;
