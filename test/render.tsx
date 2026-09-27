import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { Provider } from 'react-redux';

import { makeStore, type AppStore } from '@store/store';

/**
 * Redux store를 붙여 렌더링한다. 테스트마다 새 store
 * @returns render 결과 + store + user(userEvent)
 */
export const renderWithStore = (ui: ReactElement, { store = makeStore(), ...options }: { store?: AppStore } & RenderOptions = {}) => {
  const user = userEvent.setup();
  const result = render(<Provider store={store}>{ui}</Provider>, options);
  return { ...result, store, user };
};
