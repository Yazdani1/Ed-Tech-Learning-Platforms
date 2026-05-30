import { connectTestDb, disconnectTestDb, clearTestDb } from './testDb';

jest.mock('../../src/config/cloudinary', () => {
  const uploadToCloudinary = jest.fn(async () => ({
    url: 'https://res.cloudinary.com/test/image/upload/sample.jpg',
    publicId: 'test/sample',
    width: 640,
    height: 480,
  }));

  const uploadFileToCloudinary = jest.fn(async () => ({
    url: 'https://res.cloudinary.com/test/raw/upload/sample.pdf',
    publicId: 'test/sample-file',
    resourceType: 'raw',
  }));

  const deleteFromCloudinary = jest.fn(async () => undefined);

  return {
    __esModule: true,
    default: {
      config: jest.fn(),
      uploader: {
        upload_stream: jest.fn(),
        destroy: jest.fn(async () => ({ result: 'ok' })),
      },
    },
    uploadToCloudinary,
    uploadFileToCloudinary,
    deleteFromCloudinary,
  };
});

beforeAll(async () => {
  await connectTestDb();
});

beforeEach(async () => {
  await clearTestDb();
});

afterAll(async () => {
  await disconnectTestDb();
});
