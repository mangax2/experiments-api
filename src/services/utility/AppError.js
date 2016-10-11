const internals = {
    STATUS_CODES: Object.setPrototypeOf({
        '400': 'Bad Request',
        '401': 'Unauthorized',
        '403': 'Forbidden',
        '404': 'Not Found',
        '500': 'Internal Server Error',
    }, null)
}

internals.create = function (statusCode, message, data, ctor) {
    const error = new Error(message ? message : undefined)       // Avoids settings null message
    Error.captureStackTrace(error, ctor)                       // Filter the stack to our external API
    if (data) {
        error.data = data
    }
    internals.initialize(error, statusCode, message)
    return error
}


internals.initialize = function (error, statusCode, message) {
    error.status = statusCode
    error.code = internals.STATUS_CODES[statusCode] || 'Unknown'
    if (statusCode === 500) {
        error.errorMessage = 'An internal server error occurred'
    }
    else if (message) {
        error.errorMessage = message
    }
    return error
}


exports.badRequest = function (message, data) {
    return internals.create(400, message, data, exports.badRequest)
}


exports.unauthorized = function (message, data) {
    return internals.create(401, message, data, exports.unauthorized)


}

exports.forbidden = function (message, data) {

    return internals.create(403, message, data, exports.forbidden)
}


exports.notFound = function (message, data) {
    return internals.create(404, message, data, exports.notFound)
}


exports.internal = function (message, data, statusCode) {
    return internals.serverError(message, data, statusCode, exports.internal)
}


internals.serverError = function (message, data, statusCode, ctor) {
    let error
    if (data instanceof Error) {
        error = exports.wrap(data, statusCode, message)
    }
    else {
        error = internals.create(statusCode || 500, message, undefined, ctor)
        error.data = data
    }
    return error
}


