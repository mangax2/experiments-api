import AppError from '../../../src/services/utility/AppError'

describe('AppError', () => {
  describe('create', () => {
    test('returns an Unknown message when status code is not in the list', () => {
      const error = AppError.create(999, 'test message', {})
      expect(error.code).toEqual('Unknown')
    })
  })

  describe('BadRequest', () => {
    test('returns a 400 error status Code', () => {
      const error = AppError.badRequest()
      expect(error.status).toEqual(400)
    })
    test('sets the message with the passed in message', () => {
      const error = AppError.badRequest('Invalid Experiment Data')
      expect(error.status).toEqual(400)
      expect(error.errorMessage).toEqual('Invalid Experiment Data')
    })
    test('sets the message to Http status if none provided', () => {
      const error = AppError.badRequest()
      expect(error.status).toEqual(400)
      expect(error.errorMessage).toEqual('Bad Request')
    })
    test('sets the data to error if provided', () => {
      const error = AppError.badRequest('Invalid Experiment Data', 'experimentName')
      expect(error.status).toEqual(400)
      expect(error.errorMessage).toEqual('Invalid Experiment Data')
      expect(error.data).toEqual('experimentName')
    })
  })

  describe('notFound', () => {
    test('returns a 404 error status Code', () => {
      const error = AppError.notFound()
      expect(error.status).toEqual(404)
    })
    test('sets the message with the passed in message', () => {
      const error = AppError.notFound('Experiment Not Found')
      expect(error.status).toEqual(404)
      expect(error.errorMessage).toEqual('Experiment Not Found')
    })
    test('sets the message to Http status if none provided', () => {
      const error = AppError.notFound()
      expect(error.status).toEqual(404)
      expect(error.errorMessage).toEqual('Not Found')
    })
  })

  describe('Forbidden', () => {
    test('returns a 403 error status Code', () => {
      const error = AppError.forbidden()
      expect(error.status).toEqual(403)
    })
    test('sets the message with the passed in message', () => {
      const error = AppError.forbidden('you just don’t have permission to access this resource')
      expect(error.status).toEqual(403)
      expect(error.errorMessage).toEqual('you just don’t have permission to access this resource')
    })
    test('sets the message to Http status if none provided', () => {
      const error = AppError.forbidden()
      expect(error.status).toEqual(403)
      expect(error.errorMessage).toEqual('Forbidden')
    })
  })

  describe('unauthorized', () => {
    test('returns a 401 error status Code', () => {
      const error = AppError.unauthorized()
      expect(error.status).toEqual(401)
    })
    test('sets the message with the passed in message', () => {
      const error = AppError.unauthorized('you aren’t authenticated')
      expect(error.status).toEqual(401)
      expect(error.errorMessage).toEqual('you aren’t authenticated')
    })
    test('sets the message to Http status if none provided', () => {
      const error = AppError.unauthorized()
      expect(error.status).toEqual(401)
      expect(error.errorMessage).toEqual('Unauthorized')
    })
  })

  describe('internalServerError', () => {
    test('returns a 500 error status Code', () => {
      const error = AppError.internalServerError()
      expect(error.status).toEqual(500)
      expect(error.errorMessage).toEqual('An internal server error occurred')
    })
  })

  describe('internalServerErrorWithMessage', () => {
    test('returns a 500 error status Code', () => {
      const error = AppError.internalServerErrorWithMessage()
      expect(error.status).toEqual(500)
    })
    test('sets the message with the passed in message', () => {
      const error = AppError.internalServerErrorWithMessage('an error occurred on the server')
      expect(error.status).toEqual(500)
      expect(error.errorMessage).toEqual('an error occurred on the server')
    })
    test('sets the message to Http status if none provided', () => {
      const error = AppError.internalServerErrorWithMessage()
      expect(error.status).toEqual(500)
      expect(error.errorMessage).toEqual('Internal Server Error')
    })
  })
})
