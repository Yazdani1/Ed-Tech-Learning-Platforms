import type { PostForm } from '@/schemas/community.schema';

/** Multipart body of POST/PUT /api/community/posts: channel, title, description and `images` files. */
export const toPostFormData = (values: PostForm, images: File[]): FormData => {
  const data = new FormData();
  data.append('channel', values.channel);
  data.append('title', values.title.trim());
  data.append('description', values.description);
  images.forEach((image) => {
    data.append('images', image);
  });
  return data;
};
