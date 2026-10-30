'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

import type { z } from 'zod';

type ParamValue = string | number | boolean | undefined | null;

export interface UrlListParams<T> {
  /** The current values (URL query parsed by the schema, so defaults apply) */
  params: T;
  /** Changes some values; any change except `page` itself goes back to page 1 */
  setParams: (changes: Partial<Record<keyof T, ParamValue>>) => void;
}

/**
 * List state (page, search, filters) kept in the URL query, so reloads, back/forward and shared links keep
 * it. The schema gives types and defaults, e.g.
 * `z.object({ page: z.coerce.number().int().min(1).catch(1), search: z.string().catch('') })`.
 */
export const useUrlListParams = <S extends z.ZodType<Record<string, unknown>>>(
  schema: S,
): UrlListParams<z.infer<S>> => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const params = useMemo(
    () => schema.parse(Object.fromEntries(searchParams.entries())),
    [schema, searchParams],
  );

  const setParams = useCallback(
    (changes: Partial<Record<keyof z.infer<S>, ParamValue>>) => {
      const next = new URLSearchParams(searchParams.toString());
      (Object.entries(changes) as [string, ParamValue][]).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') next.delete(key);
        else next.set(key, String(value));
      });
      if (!('page' in changes)) next.delete('page');
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return { params, setParams };
};
