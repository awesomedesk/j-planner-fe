"use client";

import { useCallback, useState } from 'react';

import type { Category, HexColor, Id } from '@/types/api';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { ITEM_COLOR_OPTIONS } from '@components/theme/itemColorOptions';
import { fetchCategories, selectCategories } from '@store/slices/categorySlice';

import { categoryApi, isApiError } from '@utils/api';
import { useErrorNotice } from '@utils/hooks/useErrorNotice';

import { DUPLICATED_NAME_MESSAGE, getMoveAfterId, validateCategoryName, type MoveDirection } from '../utils/categoryUtils';

/**
 * 카테고리 관리 창(OV-04)의 상태와 동작 (US-04)
 * 바꾼 뒤에는 목록을 다시 받아 순서·연결 개수를 서버 값으로 맞춘다.
 */
export const useCategoryManager = () => {
  // 1. Other hooks
  const dispatch = useAppDispatch();
  const categories = useAppSelector(selectCategories);
  const notifyError = useErrorNotice();

  // 2. State
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<HexColor>(ITEM_COLOR_OPTIONS[0]);
  const [addError, setAddError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<Id | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState<HexColor>(ITEM_COLOR_OPTIONS[0]);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteConfirmId, setDeleteConfirmId] = useState<Id | null>(null);
  const [busyId, setBusyId] = useState<Id | 'new' | null>(null);

  const reload = useCallback(() => dispatch(fetchCategories()), [dispatch]);

  /** 이름 중복(409)은 칸 아래 문구로, 그 밖의 오류는 짧은 안내로 */
  const handleMutationError = useCallback(
    (error: unknown, setFieldError: (message: string) => void) => {
      if (isApiError(error) && error.code === 'CATEGORY_NAME_DUPLICATED') {
        setFieldError(DUPLICATED_NAME_MESSAGE);
        return;
      }
      if (isApiError(error) && error.code === 'VALIDATION_FAILED' && error.errors.length > 0) {
        setFieldError(error.errors[0].message);
        return;
      }
      notifyError(error);
    },
    [notifyError]
  );

  // 3. Handlers
  const changeNewName = useCallback((value: string) => {
    setNewName(value);
    setAddError(null);
  }, []);

  const addCategory = useCallback(async () => {
    const message = validateCategoryName(newName, categories);
    if (message) {
      setAddError(message);
      return;
    }
    setBusyId('new');
    try {
      await categoryApi.create({ name: newName.trim(), color: newColor });
      setNewName('');
      setAddError(null);
      await reload();
    } catch (error) {
      handleMutationError(error, setAddError);
    } finally {
      setBusyId(null);
    }
  }, [categories, handleMutationError, newColor, newName, reload]);

  const startEdit = useCallback((category: Category) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditColor(category.color);
    setEditError(null);
    setDeleteConfirmId(null);
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setEditError(null);
  }, []);

  const changeEditName = useCallback((value: string) => {
    setEditName(value);
    setEditError(null);
  }, []);

  const saveEdit = useCallback(async () => {
    const original = categories.find((c) => c.id === editingId);
    if (!original) return;
    const message = validateCategoryName(editName, categories, original.id);
    if (message) {
      setEditError(message);
      return;
    }
    const patch = {
      ...(editName.trim() !== original.name ? { name: editName.trim() } : {}),
      ...(editColor !== original.color ? { color: editColor } : {}),
    };
    if (Object.keys(patch).length === 0) {
      cancelEdit();
      return;
    }
    setBusyId(original.id);
    try {
      await categoryApi.update(original.id, patch);
      cancelEdit();
      await reload();
    } catch (error) {
      handleMutationError(error, setEditError);
    } finally {
      setBusyId(null);
    }
  }, [cancelEdit, categories, editColor, editName, editingId, handleMutationError, reload]);

  /** 삭제는 두 번 눌러 확인한다 (삭제 → 삭제 확인) */
  const deleteCategory = useCallback(
    async (category: Category) => {
      if (deleteConfirmId !== category.id) {
        setDeleteConfirmId(category.id);
        setEditingId(null);
        return;
      }
      setBusyId(category.id);
      try {
        await categoryApi.remove(category.id);
        setDeleteConfirmId(null);
        await reload();
      } catch (error) {
        notifyError(error);
      } finally {
        setBusyId(null);
      }
    },
    [deleteConfirmId, notifyError, reload]
  );

  const cancelDelete = useCallback(() => setDeleteConfirmId(null), []);

  const moveCategory = useCallback(
    async (category: Category, direction: MoveDirection) => {
      const afterId = getMoveAfterId(categories, category.id, direction);
      if (afterId === undefined) return;
      setBusyId(category.id);
      try {
        await categoryApi.move(category.id, { afterId });
        await reload();
      } catch (error) {
        notifyError(error);
      } finally {
        setBusyId(null);
      }
    },
    [categories, notifyError, reload]
  );

  // 4. Return
  return {
    categories,
    newName,
    newColor,
    addError,
    editingId,
    editName,
    editColor,
    editError,
    deleteConfirmId,
    busyId,
    changeNewName,
    setNewColor,
    addCategory,
    startEdit,
    cancelEdit,
    changeEditName,
    setEditColor,
    saveEdit,
    deleteCategory,
    cancelDelete,
    moveCategory,
  };
};
