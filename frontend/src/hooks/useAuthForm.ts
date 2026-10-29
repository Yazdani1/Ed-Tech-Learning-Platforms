'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  useForm,
  type DefaultValues,
  type FieldErrors,
  type FieldValues,
  type UseFormRegister,
} from 'react-hook-form';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import type { ApiError } from '@/services/http.service';
import type { UseMutationResult } from '@tanstack/react-query';
import type { SyntheticEvent } from 'react';
import type { z } from 'zod';

interface AuthFormOptions<T extends FieldValues> {
  schema: z.ZodType<T, T>;
  defaultValues: DefaultValues<T>;
  mutation: UseMutationResult<unknown, ApiError, T>;
  /** i18n key of the toast shown on success */
  successKey: string;
}

interface AuthForm<T extends FieldValues> {
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  onSubmit: (event: SyntheticEvent<HTMLFormElement>) => void;
  isPending: boolean;
  /** The server's message when the request failed (already user-ready) */
  serverError: string | null;
}

/** Shared wiring of the sign-in and register forms: Zod validation, submit, success toast, server error. */
export const useAuthForm = <T extends FieldValues>({
  schema,
  defaultValues,
  mutation,
  successKey,
}: AuthFormOptions<T>): AuthForm<T> => {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
  });
  const submit = handleSubmit((values) => {
    mutation.mutate(values, { onSuccess: () => toast.success(t(successKey)) });
  });
  return {
    register,
    errors,
    onSubmit: (event) => void submit(event),
    isPending: mutation.isPending,
    serverError: mutation.error?.message ?? null,
  };
};
