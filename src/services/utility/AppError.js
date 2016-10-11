const internals = {
    STATUS_CODES: {
        '400': 'Bad Request',
        '401': 'Unauthorized',
        '403': 'Forbidden',
        '404': 'Not Found',
        '500': 'Internal Server Error',
    }
}

function create(statusCode, message, data, ctor) {
    const error = new Error(message ? message : undefined)
    Error.captureStackTrace(error, ctor)
    if (data) {
        error.data = data
    }
    initialize(error, statusCode, message)
    return error
}


function initialize (error, statusCode, message) {
    error.status = statusCode
    error.code = internals.STATUS_CODES[statusCode] || 'Unknown'
    if (statusCode === 500) {
        error.errorMessage = 'An internal server error occurred'
    }
    else if (message) {
        error.errorMessage = message
    }else{
        error.errorMessage =  error.code
    }
    return error
}

exports.create=function(status,message,data){
    return create(status,message,data,exports.create)
}


exports.badRequest = function (message, data) {
    return create(400, message, data, exports.badRequest)
}


exports.unauthorized = function (message, data) {
    return create(401, message, data, exports.unauthorized)


}

exports.forbidden = function (message, data) {
    return create(403, message, data, exports.forbidden)
}


exports.notFound = function (message, data) {
    return create(404, message, data, exports.notFound)
}



