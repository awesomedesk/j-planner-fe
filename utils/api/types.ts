/**
 * J-planner API 공통 타입 (D-031: 순수 REST)
 *
 * - 성공 응답은 감싸기 없이 리소스 JSON 그대로 온다. → apiClient.get<Todo[]>() 는 Todo[] 를 돌려준다.
 * - 오류 응답은 Problem Details (RFC 9457, application/problem+json) + code, errors.
 *
 * 규칙: j-planner-product/08-api-design.md, 08-openapi.yaml
 */

/** 서버가 보내는 오류 코드 (08-api-design.md 2-6절) */
export type ApiErrorCode =
  | 'VALIDATION_FAILED'
  | 'INVALID_QUERY'
  | 'NOT_FOUND'
  | 'CATEGORY_NAME_DUPLICATED'
  | 'DEFAULT_CATEGORY_LOCKED'
  | 'UNSUPPORTED_REQUEST'
  | 'INTERNAL_ERROR';

/** 서버 응답을 받지 못했거나 Problem Details가 아닌 응답일 때 FE가 붙이는 코드 */
export type ClientErrorCode = 'TIMEOUT' | 'NETWORK_ERROR' | 'UNKNOWN_ERROR';

/** 입력값 오류의 필드별 내용 */
export interface FieldErrorDetail {
  field: string;
  message: string;
}

/** 서버 오류 응답 본문 (RFC 9457 Problem Details + code, errors) */
export interface ProblemDetail {
  type?: string;
  title: string;
  status: number;
  /** 화면에 그대로 보여줘도 되는 한국어 설명 */
  detail?: string;
  instance?: string;
  code: ApiErrorCode;
  errors: FieldErrorDetail[];
}

/** 쿼리 파라미터. 배열은 같은 이름으로 반복된다 (?categoryId=1&categoryId=3). null·undefined는 빠진다 */
export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue | QueryValue[]>;
