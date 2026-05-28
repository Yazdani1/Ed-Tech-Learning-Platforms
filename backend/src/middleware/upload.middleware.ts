import multer from 'multer';
import { AppError } from '../utils/AppError';

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new AppError('Only image files are allowed', 400));
    }
  },
});

export const uploadAnyFile = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 10 },
});
