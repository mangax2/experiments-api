import  { mock } from '../jestUtil'
import VariablesValidator from '../../src/validations/VariablesValidator'
import AppError from '../../src/services/utility/AppError'

describe('VariablesValidator', () => {
  let target

  beforeEach(() => {
    target = new VariablesValidator()
  })

  describe('preValidate', () => {
    it('indicates bad request if the element is an array', () => {
      AppError.badRequest = mock()

      return target.preValidate([]).then(() => {}, () => {
        expect(AppError.badRequest).toHaveBeenCalledWith(
          'Variables request object cannot be an array')
      })
    })

    it('resolves when element is an object', () => {
      AppError.badRequest = mock()

      return target.preValidate({}).then(() => {
        expect(AppError.badRequest).not.toHaveBeenCalledWith()
      })
    })
  })

  describe('validateEntity', () => {
    it('resolves when all independent variables have at least one level', () => {
      const variables = {
        independent: [
          {
            levels: [{}]
          }
        ]
      }
      return target.validateEntity(variables).then(() => {
        expect(target.hasErrors()).toEqual(false)
      })
    })

    it('resolves when no independent variables specified', () => {
      const variables = {
        independent: []
      }
      return target.validateEntity(variables).then(() => {
        expect(target.hasErrors()).toEqual(false)
      })
    })

    it('resolves when independent variables property omitted', () => {
      const variables = {}
      return target.validateEntity(variables).then(() => {
        expect(target.hasErrors()).toEqual(false)
      })
    })

    it('pushes message when at least one independent variable has no levels', () => {
      const variables = {
        independent: [
          {
            levels: [{}]
          },
          {
            levels: []
          }
        ]
      }
      return target.validateEntity(variables).then(() => {
        expect(target.hasErrors()).toEqual(true)
        expect(target.messages[0]).toEqual('Factors must contain at least one level.')
      })
    })
  })
})