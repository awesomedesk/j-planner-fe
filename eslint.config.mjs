import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';

/** ESLint flat config (Next 16: next lint 제거 → `npm run lint` = `eslint .`, US-31) */
const eslintConfig = [
  ...nextCoreWebVitals,
  { ignores: ['node_modules/**', '.next/**', 'out/**', 'next-env.d.ts', 'types/api/schema.d.ts'] },
];

export default eslintConfig;
