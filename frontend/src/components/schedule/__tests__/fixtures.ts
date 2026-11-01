import { http } from 'msw';

import { scheduleSchema, type Schedule } from '@/schemas/schedule.schema';
import { fail, ok } from '@/test/msw/handlers';

let counter = 0;

/** A timer or reminder as the backend returns it (checked against the app's schema). */
export const makeSchedule = (overrides: Partial<Schedule> = {}): Schedule => {
  counter += 1;
  const now = new Date().toISOString();
  return scheduleSchema.parse({
    _id: `64b7f0c2a1b2c3d4e5f7${String(counter).padStart(4, '0')}`,
    type: 'timer',
    title: `Item ${counter}`,
    description: '',
    status: 'active',
    duration: 1500,
    elapsedSeconds: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
};

export interface Recorded {
  method: string;
  id?: string;
  body?: unknown;
}

/**
 * A small in-memory study-schedules API: GET filters by type/status like the backend, writes change the
 * list and are recorded so tests can check what the page sent.
 */
export const scheduleApi = (initial: Schedule[], options: { failList?: boolean } = {}) => {
  let items = [...initial];
  const calls: Recorded[] = [];
  const handlers = [
    http.get('*/api/study-schedules', ({ request }) => {
      if (options.failList) return fail(500, 'Could not load your schedule');
      const params = new URL(request.url).searchParams;
      const type = params.get('type');
      const status = params.get('status');
      const data = items.filter(
        (item) => (!type || item.type === type) && (!status || item.status === status),
      );
      return ok(data, { total: data.length });
    }),
    http.post('*/api/study-schedules/:kind', async ({ request, params }) => {
      const body = (await request.json()) as Partial<Schedule>;
      calls.push({ method: `POST ${String(params.kind)}`, body });
      const created = makeSchedule({
        ...body,
        type: params.kind === 'timer' ? 'timer' : 'reminder',
        status: params.kind === 'timer' ? 'active' : 'pending',
      });
      items = [created, ...items];
      return ok(created);
    }),
    http.put('*/api/study-schedules/:id', async ({ request, params }) => {
      const body = (await request.json()) as Partial<Schedule>;
      const id = String(params.id);
      calls.push({ method: 'PUT', id, body });
      const current = items.find((item) => item._id === id);
      if (!current) return fail(404, 'Schedule not found');
      const saved = { ...current, ...body, updatedAt: new Date().toISOString() };
      items = items.map((item) => (item._id === id ? saved : item));
      return ok(saved);
    }),
    http.delete('*/api/study-schedules/:id', ({ params }) => {
      const id = String(params.id);
      calls.push({ method: 'DELETE', id });
      items = items.filter((item) => item._id !== id);
      return ok(undefined);
    }),
  ];
  return { handlers, calls };
};
