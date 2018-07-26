const internals = {
  STATUS_CODES: {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    500: 'Internal Server Error',
  },
}

function initialize(error, statusCode, message) {
  error.status = statusCode
  error.code = internals.STATUS_CODES[statusCode] || 'Unknown'
  if (statusCode === 500) {
    error.errorMessage = 'An internal server error occurred'
  } else if (message) {
    error.errorMessage = message
  } else {
    error.errorMessage = error.code
  }
  return error
}

function create(statusCode, message, data, errorCode, ctor) {
  const error = new Error(message || undefined)
  Error.captureStackTrace(error, ctor)
  if (data) {
    error.data = data
  }
  error.errorCode = errorCode
  initialize(error, statusCode, message)
  return error
}

exports.create = function (status, message, data, errorCode) {
  return create(status, message, data, errorCode, exports.create)
}

exports.badRequest = function (message, data, errorCode) {
  return create(400, message, data, errorCode, exports.badRequest)
}

exports.unauthorized = function (message, data, errorCode) {
  return create(401, message, data, errorCode, exports.unauthorized)
}

exports.forbidden = function (message, data, errorCode) {
  return create(403, message, data, errorCode, exports.forbidden)
}

exports.notFound = function (message, data, errorCode) {
  return create(404, message, data, errorCode, exports.notFound)
}

exports.internalServerError = function (message, data, errorCode) {
  return create(500, message, data, errorCode, exports.internalServerError)
}
