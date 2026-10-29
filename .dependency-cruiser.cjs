// Frontend architecture rules, checked by `npm run arch:check` (part of `npm run lint`) and in CI.
// The same tool draws docs/dependency-graph.md (`npm run docs:generate`).
// The backend and legacy-frontend/ are not checked here.
const SEVERITY = 'error';

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: SEVERITY,
      comment: 'Circular imports make code hard to follow and test. Extract the shared part.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'frontend-backend-separated',
      severity: SEVERITY,
      comment: 'The frontend talks to the backend over HTTP only; it never imports backend code.',
      from: { path: '^frontend/' },
      to: { path: '^backend/' },
    },
    {
      name: 'frontend-requests-go-through-api',
      severity: SEVERITY,
      comment:
        'Routes, components and hooks call the backend only through src/api/<feature>.api.ts, which uses the one services/http.service.ts. Types may be imported anywhere.',
      from: { path: '^frontend/src/(app|components|hooks)/' },
      to: { path: '^frontend/src/services/', dependencyTypesNot: ['type-only'] },
    },
    {
      name: 'axios-only-in-http-service',
      severity: SEVERITY,
      comment: 'Only services/http.service.ts creates and uses the axios client.',
      from: {
        path: '^frontend/src/',
        pathNot: '^frontend/src/services/http\\.service\\.ts$',
      },
      to: { path: 'node_modules/axios/', dependencyTypesNot: ['type-only'] },
    },
    {
      name: 'frontend-api-has-no-ui',
      severity: SEVERITY,
      comment: 'src/api/ talks to the server only; screens and layouts use it, never the reverse.',
      from: { path: '^frontend/src/api/' },
      to: { path: '^frontend/src/(app|components)/' },
    },
    {
      name: 'frontend-building-blocks-are-reusable',
      severity: SEVERITY,
      comment:
        'services/, utils/, theme/ and i18n/ are low-level building blocks; they must not depend on api, hooks, components or routes.',
      from: { path: '^frontend/src/(services|utils|theme|i18n)/' },
      to: { path: '^frontend/src/(api|hooks|components|app)/' },
    },
    {
      name: 'frontend-types-are-leaves',
      severity: SEVERITY,
      comment:
        'src/types/ holds TypeScript shapes any layer may import; it never imports other frontend code, so it can never create a cycle.',
      from: { path: '^frontend/src/types/' },
      to: { path: '^frontend/src/', pathNot: '^frontend/src/types/' },
    },
    {
      name: 'no-dev-dependencies-in-app-code',
      severity: SEVERITY,
      comment:
        'Production code must not import devDependencies (they are missing in the production build).',
      from: {
        path: '^frontend/src/',
        pathNot: ['__tests__/', '\\.test\\.tsx?$', '^frontend/src/test/'],
      },
      to: { dependencyTypes: ['npm-dev'], dependencyTypesNot: ['type-only'] },
    },
  ],
  options: {
    doNotFollow: { path: ['node_modules'] },
    exclude: {
      // Tests and test helpers are left out of the graph and the layering rules.
      path: [
        'node_modules',
        '/dist/',
        '/\\.next/',
        '/coverage/',
        '__tests__/',
        '\\.test\\.tsx?$',
        '^frontend/src/test/',
      ],
    },
    includeOnly: '^frontend/src/',
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.depcruise.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      mainFields: ['module', 'main', 'types'],
    },
    reporterOptions: {
      mermaid: { minify: false },
    },
  },
};
