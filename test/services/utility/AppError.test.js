import AppError from '../../../src/services/utility/AppError'

describe('AppError', () => {
  describe('create', () => {
    it('returns an Unknown message when status code is not in the list', () => {
      const error = AppError.create(999, 'test message', {})
      expect(error.code).toEqual('Unknown')
    })
  })

  describe('BadRequest', () => {

    it('returns a 400 error status Code', () => {
      const error = AppError.badRequest()
      expect(error.status).toEqual(400)
    })
    it('sets the message with the passed in message', () => {
      const error = AppError.badRequest('Invalid Experiment Data')
      expect(error.status).toEqual(400)
      expect(error.errorMessage).toEqual('Invalid Experiment Data')
    })
    it('sets the message to Http status if none provided', () => {
      const error = AppError.badRequest()
      expect(error.status).toEqual(400)
      expect(error.errorMessage).toEqual('Bad Request')
    })
    it('sets the data to error if provided', () => {
      const error = AppError.badRequest('Invalid Experiment Data', 'experimentName')
      expect(error.status).toEqual(400)
      expect(error.errorMessage).toEqual('Invalid Experiment Data')
      expect(error.data).toEqual('experimentName')
    })
  })

  describe('notFound', () => {

    it('returns a 404 error status Code', () => {
      const error = AppError.notFound()
      expect(error.status).toEqual(404)
    })
    it('sets the message with the passed in message', () => {
      const error = AppError.notFound('Experiment Not Found')
      expect(error.status).toEqual(404)
      expect(error.errorMessage).toEqual('Experiment Not Found')
    })
    it('sets the message to Http status if none provided', () => {
      const error = AppError.notFound()
      expect(error.status).toEqual(404)
      expect(error.errorMessage).toEqual('Not Found')
    })
  })

  describe('Forbidden', () => {

    it('returns a 403 error status Code', () => {
      const error = AppError.forbidden()
      expect(error.status).toEqual(403)
    })
    it('sets the message with the passed in message', () => {
      const error = AppError.forbidden('you just don’t have permission to access this resource')
      expect(error.status).toEqual(403)
      expect(error.errorMessage).toEqual('you just don’t have permission to access this resource')
    })
    it('sets the message to Http status if none provided', () => {
      const error = AppError.forbidden()
      expect(error.status).toEqual(403)
      expect(error.errorMessage).toEqual('Forbidden')
    })
  })

  describe('unauthorized', () => {

    it('returns a 401 error status Code', () => {
      const error = AppError.unauthorized()
      expect(error.status).toEqual(401)
    })
    it('sets the message with the passed in message', () => {
      const error = AppError.unauthorized('you aren’t authenticated')
      expect(error.status).toEqual(401)
      expect(error.errorMessage).toEqual('you aren’t authenticated')
    })
    it('sets the message to Http status if none provided', () => {
      const error = AppError.unauthorized()
      expect(error.status).toEqual(401)
      expect(error.errorMessage).toEqual('Unauthorized')
    })

  })

  describe('internalServer Error', () => {

    it('returns a 500 error status Code', () => {
      const error = AppError.create(500)
      expect(error.status).toEqual(500)
      expect(error.errorMessage).toEqual('An internal server error occurred')
    })
  })
})