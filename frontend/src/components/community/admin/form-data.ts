/** Multipart body of the admin forms: text fields plus an optional `image` file. */
export const toAdminFormData = (
  fields: Record<string, string>,
  image: File | undefined,
): FormData => {
  const data = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    data.append(key, value);
  });
  if (image) data.append('image', image);
  return data;
};
