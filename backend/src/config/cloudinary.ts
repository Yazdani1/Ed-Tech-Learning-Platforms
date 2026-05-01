import { v2 as cloudinary } from 'cloudinary';
import { config } from './env';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export default cloudinary;

export const uploadToCloudinary = (
  buffer: Buffer,
  folder: string
): Promise<{ url: string; publicId: string }> =>
  new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: 'image' }, (error, result) => {
        if (error || !result) return reject(error ?? new Error('Cloudinary upload failed'));
        resolve({ url: result.secure_url, publicId: result.public_id });
      })
      .end(buffer);
  });

export const deleteFromCloudinary = (publicId: string): Promise<void> =>
  cloudinary.uploader.destroy(publicId).then(() => undefined);
