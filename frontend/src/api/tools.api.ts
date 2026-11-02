'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { z } from 'zod';

import { toolSchema, type Tool } from '@/schemas/tools.schema';
import { http, type ApiError } from '@/services/http.service';

import { queryKeys } from './query-keys';

const TOOLS = '/api/tools';
const UPLOAD_TIMEOUT_MS = 60_000;

export interface SaveToolInput {
  /** Set when editing */
  id?: string;
  name: string;
  /** Required for a new tool; optional replacement when editing */
  logo?: File;
}

// ---- Requests ----

export const getTools = (): Promise<Tool[]> => http.get(TOOLS, z.array(toolSchema));

/** Multipart: name + logo. */
export const saveTool = ({ id, name, logo }: SaveToolInput): Promise<Tool> => {
  const data = new FormData();
  data.append('name', name);
  if (logo) data.append('logo', logo);
  const options = { timeoutMs: UPLOAD_TIMEOUT_MS };
  return id
    ? http.put(`${TOOLS}/${encodeURIComponent(id)}`, data, toolSchema, options)
    : http.post(TOOLS, data, toolSchema, options);
};

/** Also removes the tool from every course that lists it. */
export const deleteTool = async (id: string): Promise<void> => {
  await http.send('DELETE', `${TOOLS}/${encodeURIComponent(id)}`);
};

// ---- Hooks ----

/** Every tool (Course Setup > Tools, the course editor's Tools section). */
export const useTools = (): UseQueryResult<Tool[], ApiError> =>
  useQuery({ queryKey: queryKeys.public.tools, queryFn: getTools });

const useToolMutation = <Input, Output>(
  mutationFn: (input: Input) => Promise<Output>,
): UseMutationResult<Output, ApiError, Input> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    // Course pages show tool names and logos too
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.public.tools }),
        queryClient.invalidateQueries({ queryKey: queryKeys.browse.all }),
      ]),
  });
};

export const useSaveTool = (): UseMutationResult<Tool, ApiError, SaveToolInput> =>
  useToolMutation(saveTool);

export const useDeleteTool = (): UseMutationResult<void, ApiError, string> =>
  useToolMutation(deleteTool);
