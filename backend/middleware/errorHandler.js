// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle database errors
const handleDatabaseError = (error) => {
  // PostgreSQL error codes
  if (error.code === '23505') {
    // Unique violation
    const field = error.detail?.match(/Key \((.+?)\)/)?.[1] || 'field';
    return new AppError(`This ${field} already exists`, 400);
  }

  if (error.code === '23503') {
    // Foreign key violation
    return new AppError('Referenced resource does not exist', 400);
  }

  if (error.code === '23502') {
    // Not null violation
    const field = error.column || 'field';
    return new AppError(`${field} is required`, 400);
  }

  if (error.code === '22P02') {
    // Invalid text representation
    return new AppError('Invalid data format provided', 400);
  }

  return new AppError('Database operation failed', 500);
};

// Handle JWT errors
const handleJWTError = () => {
  return new AppError('Invalid token. Please log in again', 401);
};

const handleJWTExpiredError = () => {
  return new AppError('Your token has expired. Please log in again', 401);
};

// Send error in development
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// Send error in production
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // Programming or unknown error: don't leak error details
    console.error('ERROR 💥', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (err.code && err.code.startsWith('23')) {
      error = handleDatabaseError(err);
    }
    if (err.name === 'JsonWebTokenError') {
      error = handleJWTError();
    }
    if (err.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    }

    sendErrorProd(error, res);
  } else {
    // Default to development mode if NODE_ENV not set
    sendErrorDev(err, res);
  }
};

// Catch async errors wrapper
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

// 404 handler
const notFound = (req, res, next) => {
  const error = new AppError(`Cannot find ${req.originalUrl} on this server`, 404);
  next(error);
};

module.exports = {
  AppError,
  errorHandler,
  catchAsync,
  notFound,
};