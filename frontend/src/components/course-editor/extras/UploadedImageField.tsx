'use client';

import { useUploadCourseImage } from '@/api/course-extras.api';
import { ImagePickField } from '@/components/common/ImagePickField';

import type { CourseImage } from '@/schemas/course-extras.schema';
import type { FC } from 'react';

interface UploadedImageFieldProps {
  courseId: string;
  label: string;
  image: CourseImage | null;
  onChange: (image: CourseImage) => void;
  round?: boolean;
}

/** An image of a course section: picked, uploaded at once, then handed back as { url, publicId }. */
export const UploadedImageField: FC<UploadedImageFieldProps> = ({
  courseId,
  label,
  image,
  onChange,
  round = false,
}) => {
  const upload = useUploadCourseImage(courseId);
  return (
    <ImagePickField
      label={label}
      previewUrl={image?.url}
      round={round}
      busy={upload.isPending}
      error={upload.error?.message}
      onFile={(file) => {
        upload.mutate(file, { onSuccess: onChange });
      }}
    />
  );
};
