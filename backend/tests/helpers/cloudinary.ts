// Cloudinary stand-in for upload tests: the SDK's uploader is stubbed at its boundary (no network),
// the backend's own config/cloudinary.ts helpers run unchanged on top of it.
import { vi, type MockInstance } from 'vitest';

import cloudinary from '../../src/config/cloudinary';

type UploadCallback = (error: unknown, result?: Record<string, unknown>) => void;

export interface CloudinaryMock {
  upload: MockInstance;
  destroy: MockInstance;
}

let uploadCount = 0;

/** Stubs upload_stream (answers with a fake secure URL) and destroy. Restore with vi.restoreAllMocks(). */
export const mockCloudinary = (): CloudinaryMock => {
  const upload = vi.spyOn(cloudinary.uploader, 'upload_stream').mockImplementation(((
    options: { folder?: string; resource_type?: string },
    callback: UploadCallback,
  ) => {
    uploadCount += 1;
    const publicId = `${options.folder ?? 'test'}/file-${uploadCount}`;
    return {
      end: () =>
        callback(undefined, {
          secure_url: `https://res.cloudinary.com/test-cloud/${publicId}`,
          public_id: publicId,
          resource_type: options.resource_type === 'auto' ? 'raw' : 'image',
          width: 1,
          height: 1,
        }),
    };
  }) as unknown as typeof cloudinary.uploader.upload_stream);
  const destroy = vi
    .spyOn(cloudinary.uploader, 'destroy')
    .mockResolvedValue({ result: 'ok' } as Awaited<ReturnType<typeof cloudinary.uploader.destroy>>);
  return { upload, destroy };
};
