import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import type { Category } from '@/types/api';

import { categoryApi, toErrorMessage } from '@utils/api';

/**
 * 카테고리 목록 (CAT, D-014, D-029)
 * 앱을 열 때 한 번 받고(08-api-design 11절), 카테고리 관리에서 바꾸면 다시 받는다.
 * 필터 드롭다운·입력 창의 카테고리 목록이 이 순서를 그대로 쓴다.
 */
interface CategoryState {
  items: Category[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: CategoryState = { items: [], status: 'idle', error: null };

export const fetchCategories = createAsyncThunk<Category[], void, { rejectValue: string }>(
  'category/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      return await categoryApi.getList();
    } catch (error) {
      return rejectWithValue(toErrorMessage(error));
    }
  }
);

/** `미지정` 맨 위, 그다음 sortOrder 순 (서버도 이 순서로 주지만 한 번 더 맞춘다) */
export const sortCategories = (items: Category[]) =>
  [...items].sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.sortOrder - b.sortOrder);

const categorySlice = createSlice({
  name: 'category',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = sortCategories(action.payload);
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? null;
      });
  },
});

export const selectCategories = (state: { category: CategoryState }) => state.category.items;
export const selectCategoryStatus = (state: { category: CategoryState }) => state.category.status;
export const selectCategoryError = (state: { category: CategoryState }) => state.category.error;

export default categorySlice.reducer;
