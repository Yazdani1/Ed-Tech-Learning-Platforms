import { fromLocalInput, toDateTimeInput } from '@/utils/dateTime';

import type { HeroPost, HeroPostForm } from '@/schemas/showcase.schema';

/** Form values for a new upload (goes after the last image) or for editing a post. */
export const heroFormValues = (post: HeroPost | undefined, postCount: number): HeroPostForm =>
  post
    ? {
        // A pending change shows the visibility it will switch to, as the old page did
        visibility: post.scheduledVisibility ?? post.visibility,
        publishAt: toDateTimeInput(post.publishAt),
        order: String(post.order),
      }
    : { visibility: 'Private', publishAt: '', order: String(postCount) };

/**
 * The multipart body of POST /api/home-hero-posts (`images`) or PUT /api/home-hero-posts/:id (`image`).
 * publishAt goes as UTC; on edit an empty value is sent so a cleared date removes the schedule.
 */
export const heroFormData = (values: HeroPostForm, files: File[], isEdit: boolean): FormData => {
  const data = new FormData();
  data.append('visibility', values.visibility);
  if (values.order !== '') data.append('order', values.order);
  const publishAt = fromLocalInput(values.publishAt);
  if (publishAt || isEdit) data.append('publishAt', publishAt ?? '');
  if (isEdit) {
    const [replacement] = files;
    if (replacement) data.append('image', replacement);
  } else {
    files.forEach((file) => {
      data.append('images', file);
    });
  }
  return data;
};
