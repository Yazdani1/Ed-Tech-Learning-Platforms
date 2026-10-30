import dotenv from 'dotenv';

dotenv.config();

// Tokens signed with a known default secret could be forged: production refuses to start without one.
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in production');
}

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/medhabee_db',
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret-in-production',
  jwtExpire: process.env.JWT_EXPIRE || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
};
