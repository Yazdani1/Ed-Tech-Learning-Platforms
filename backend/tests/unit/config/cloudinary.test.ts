import { deleteFromCloudinary, uploadFileToCloudinary, uploadToCloudinary } from '../../../src/config/cloudinary';

describe('Cloudinary config adapter mock contract', () => {
  it('returns normalized image upload metadata for tests', async () => {
    const result = await uploadToCloudinary(Buffer.from('image'), 'test/images');

    expect(result).toMatchObject({
      url: expect.stringContaining('cloudinary.com'),
      publicId: expect.any(String),
      width: expect.any(Number),
      height: expect.any(Number),
    });
  });

  it('returns normalized file upload metadata for tests', async () => {
    const result = await uploadFileToCloudinary(Buffer.from('file'), 'test/files');

    expect(result).toMatchObject({
      url: expect.stringContaining('cloudinary.com'),
      publicId: expect.any(String),
      resourceType: expect.any(String),
    });
  });

  it('exposes delete as an awaitable no-op in automated tests', async () => {
    await expect(deleteFromCloudinary('test/public-id')).resolves.toBeUndefined();
  });
});
