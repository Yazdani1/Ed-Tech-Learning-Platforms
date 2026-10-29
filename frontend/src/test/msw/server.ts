import { setupServer } from 'msw/node';

import { handlers } from './handlers';

/** API mock for component tests: relative `/api/...` calls resolve against jsdom's http://localhost:3000. */
export const server = setupServer(...handlers);
