import { queryKeys } from './query-keys';

import type { QueryClient } from '@tanstack/react-query';

/**
 * After a course was created, saved, published, deleted or bulk edited: every list and page that shows
 * courses is read again (staff list, catalog and course pages, home page, teacher's courses).
 * `keepCourseId`: that course's own cache entry is left alone (the editor wrote the saved values into it, so
 * the open form is not reloaded while the user types).
 */
export const refreshCourseLists = async (
  queryClient: QueryClient,
  keepCourseId?: string,
): Promise<void> => {
  const keptKey = keepCourseId ? queryKeys.browse.course(keepCourseId) : undefined;
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.adminCourses.all }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.browse.all,
      predicate: (query) =>
        keptKey === undefined || JSON.stringify(query.queryKey) !== JSON.stringify(keptKey),
    }),
    queryClient.invalidateQueries({ queryKey: queryKeys.public.all }),
    queryClient.invalidateQueries({ queryKey: queryKeys.teacher.myCourses }),
  ]);
};
