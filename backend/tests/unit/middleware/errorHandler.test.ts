import { Error as MongooseError } from 'mongoose';
import { errorHandler } from '../../../src/middleware/errorHandler';
import { AppError } from '../../../src/utils/AppError';

const createResponse = () => {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res;
};

describe('errorHandler middleware', () => {
  it('formats AppError responses with the provided status and message', () => {
    const res = createResponse();

    errorHandler(new AppError('No access', 403), {} as never, res as never, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'No access' });
  });

  it('formats Mongo duplicate key errors as bad requests', () => {
    const res = createResponse();

    errorHandler(Object.assign(new Error('duplicate'), { code: 11000 }), {} as never, res as never, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Duplicate field value entered' });
  });

  it('formats Mongoose validation errors with joined validation messages', () => {
    const res = createResponse();
    const err = new MongooseError.ValidationError();
    err.addError('email', new MongooseError.ValidatorError({ path: 'email', message: 'Email is invalid' }));
    err.addError('name', new MongooseError.ValidatorError({ path: 'name', message: 'Name is required' }));

    errorHandler(err, {} as never, res as never, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Email is invalid, Name is required',
    });
  });

  it('formats Mongoose cast errors as invalid field responses', () => {
    const res = createResponse();
    const err = new MongooseError.CastError('ObjectId', 'bad-id', '_id');

    errorHandler(err, {} as never, res as never, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Invalid _id: bad-id' });
  });

  it('hides unknown error details outside development', () => {
    const res = createResponse();

    errorHandler(new Error('Database exploded'), {} as never, res as never, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ success: false, message: 'Internal Server Error' });
  });
});
