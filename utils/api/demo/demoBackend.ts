import { ApiError, isApiError, setRequestInterceptor, type RequestInterceptor } from '../client';
import type { QueryParams } from '../types';
import type { DemoData } from './demoData';

/**
 * 둘러보기 가짜 백엔드 (US-40, 06 SITE-08)
 * - apiClient의 요청 가로채기로 설치한다 → 실제 서버(계정 데이터 API)에 아무것도 보내지 않는다
 * - 조회(GET)는 예시 데이터의 **복사본**으로 답한다 (화면이 고쳐도 예시는 그대로)
 * - 바꾸는 요청(POST·PUT·PATCH·DELETE)은 보내기 전에 onBlocked(안내 창)를 부르고 DEMO_READ_ONLY로 막는다
 */

/** 둘러보기에서 막은 저장 — 문구 없음(안내 창이 대신) */
export const isDemoBlocked = (error: unknown) => isApiError(error) && error.code === 'DEMO_READ_ONLY';

const blocked = () => new ApiError({ message: '', status: 0, code: 'DEMO_READ_ONLY' });
const notFound = () => new ApiError({ message: '찾을 수 없어요.', status: 404, code: 'NOT_FOUND' });

const copy = <T>(value: T): T => structuredClone(value);
const text = (params: QueryParams | undefined, key: string) => {
  const value = params?.[key];
  return typeof value === 'string' ? value : undefined;
};
const idsOf = (params: QueryParams | undefined) => {
  const value = params?.categoryId;
  if (value === undefined || value === null) return null;
  return (Array.isArray(value) ? value : [value]).map(Number);
};

export interface DemoBackend {
  interceptor: RequestInterceptor;
  onBlocked: () => void;
}

export function createDemoBackend(data: DemoData, onBlocked: () => void): DemoBackend {
  const interceptor: RequestInterceptor = async ({ method, path, params }) => {
    if (method !== 'GET') {
      onBlocked();
      throw blocked();
    }
    const categories = idsOf(params);
    const inCategory = (id: number) => categories === null || categories.includes(id);
    const [, resource, id] = path.split('/');

    switch (resource) {
      case 'health':
        return { status: 'UP' };
      case 'me':
        throw new ApiError({ message: '로그인이 필요해요', status: 401, code: 'UNAUTHENTICATED' });
      case 'categories':
        return copy(data.categories);
      case 'schedules': {
        if (id) {
          const found = data.schedules.find((s) => String(s.id) === id);
          if (!found) throw notFound();
          return copy(found);
        }
        const from = text(params, 'from') ?? '';
        const to = text(params, 'to') ?? '9999-12-31';
        return copy(data.schedules.filter((s) => s.start.slice(0, 10) <= to && s.end.slice(0, 10) >= from && inCategory(s.categoryId)));
      }
      case 'todos': {
        if (id) {
          const found = data.todos.find((t) => String(t.id) === id);
          if (!found) throw notFound();
          return copy(found);
        }
        const date = text(params, 'date');
        const from = date ?? text(params, 'from') ?? '';
        const to = date ?? text(params, 'to') ?? '9999-12-31';
        const scheduledOnly = params?.scheduled === true || params?.scheduled === 'true';
        return copy(
          data.todos.filter((t) => t.startDate <= to && t.endDate >= from && inCategory(t.categoryId) && (!scheduledOnly || t.time !== null))
        );
      }
      case 'memos': {
        if (id) {
          const found = data.memos.find((m) => String(m.id) === id);
          if (!found) throw notFound();
          return copy(found);
        }
        return copy(data.memos);
      }
      default:
        return [];
    }
  };
  return { interceptor, onBlocked };
}

let current: DemoBackend | null = null;

/** 둘러보기 켜기·끄기 (null = 끄고 실제 서버로) */
export function installDemoMode(backend: DemoBackend | null) {
  current = backend;
  setRequestInterceptor(backend?.interceptor ?? null);
}

/**
 * 화면을 먼저 바꾸는(낙관적) 저장 직전에 부른다 — 둘러보기면 안내 창을 띄우고 false (화면도 예시도 바꾸지 않음).
 * 둘러보기가 아니면 true.
 */
export function allowWrite(): boolean {
  if (!current) return true;
  current.onBlocked();
  return false;
}
