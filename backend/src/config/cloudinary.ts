import { v2 as cloudinary } from 'cloudinary';
import { config } from './env';
import { AppError } from '../utils/AppError';
import { detectFileKind, isImageBuffer } from '../utils/fileType';

cloudinary.config({
  cloud_name: config.cloudinary.cloudName,
  api_key: config.cloudinary.apiKey,
  api_secret: config.cloudinary.apiSecret,
});

export default cloudinary;

export const uploadToCloudinary = (
  buffer: Buffer,
  folder: string
): Promise<{ url: string; publicId: string; width?: number; height?: number }> =>
  new Promise((resolve, reject) => {
    // The declared MIME type can lie: only real PNG/JPEG/GIF/WEBP bytes are uploaded as images.
    if (!isImageBuffer(buffer)) return reject(new AppError('Only image files are allowed', 400));
    cloudinary.uploader
      .upload_stream({ folder, resource_type: 'image' }, (error, result) => {
        if (error || !result) return reject(error ?? new Error('Cloudinary upload failed'));
        resolve({ url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height });
      })
      .end(buffer);
  });

export const uploadFileToCloudinary = (
  buffer: Buffer,
  folder: string
): Promise<{ url: string; publicId: string; resourceType: string }> =>
  new Promise((resolve, reject) => {
    // Attachments: images, PDF, Office/ZIP, audio/video and plain text only (checked by content).
    if (!detectFileKind(buffer)) return reject(new AppError('This file type is not allowed', 400));
    cloudinary.uploader
      .upload_stream({ folder, resource_type: 'auto' }, (error, result) => {
        if (error || !result) return reject(error ?? new Error('Cloudinary upload failed'));
        resolve({ url: result.secure_url, publicId: result.public_id, resourceType: result.resource_type });
      })
      .end(buffer);
  });

export const deleteFromCloudinary = (publicId: string): Promise<void> =>
  cloudinary.uploader.destroy(publicId).then(() => undefined);
