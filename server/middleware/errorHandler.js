export class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function notFoundHandler(req, res, next) {
  const error = new ApiError(404, `Endpoint not found: [${req.method}] ${req.originalUrl}`);
  next(error);
}

export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || null;

  // Handle Multer-specific errors
  if (err.name === 'MulterError') {
    statusCode = 400;
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = `File is too large. Maximum allowed size is ${process.env.MAX_FILE_SIZE_MB || 50} MB.`;
        break;
      case 'LIMIT_FILE_COUNT':
        message = `Too many files uploaded at once. Maximum allowed is ${process.env.MAX_FILES_COUNT || 10} files.`;
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = `Unexpected form field: "${err.field}". Please use "file" (single) or "files" (multiple).`;
        break;
      default:
        message = `Upload error: ${err.message}`;
    }
  }

  // Handle MongoDB / BSON ObjectId casting errors
  if (err.name === 'BSONError' || err.message?.includes('hex characters')) {
    statusCode = 400;
    message = 'Invalid file ID format. ID must be a 24-character hexadecimal string.';
  }

  const response = {
    success: false,
    status: statusCode,
    message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  };

  if (details) {
    response.details = details;
  }

  if (process.env.NODE_ENV === 'development' && statusCode === 500) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}
