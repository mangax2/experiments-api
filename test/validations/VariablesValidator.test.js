import { mock } from '../jestUtil'
import VariablesValidator from '../../src/validations/VariablesValidator'
import AppError from '../../src/services/utility/AppError'

describe('VariablesValidator', () => {
  const TEST_FAILED =
    Promise.reject(new Error('Promise expected to be rejected, but was resolved instead.'))

  let target

  beforeEach(() => {
    expect.hasAssertions()
    target = new VariablesValidator()
  })

  describe('preValidate', () => {
    test('indicates bad request if the element is an array', () => {
      AppError.badRequest = mock()

      return target.preValidate([]).then(
        () => TEST_FAILED,
        () => {
          expect(AppError.badRequest).toHaveBeenCalledWith('Variables request object cannot be an array', undefined, '3H2001')
        },
      )
    })

    test('indicates bad request if not all nested variables have an associated variable', () => {
      AppError.badRequest = mock()

      return target.preValidate({
        treatmentVariables: [
          {
            levels: [
              {
                _refId: 1,
              },
              {
                _refId: 2,
              },
            ],
          },
          {
            levels: [
              {
                _refId: 3,
              },
              {
                _refId: 4,
              },
            ],
          },
        ],
        treatmentVariableAssociations: [
          {
            associatedLevelRefId: 1,
            nestedLevelRefId: 3,
          },
        ],
      }).then(
        () => TEST_FAILED,
        () => {
          expect(AppError.badRequest).toHaveBeenCalledWith('An association must exist for all levels of a nested variable.', undefined, '3H2006')
        },
      )
    })

    test('indicates bad request if multiple levels within a factor have the same _refId', () => {
      AppError.badRequest = mock()

      return target.preValidate({
        treatmentVariables: [
          {
            levels: [
              {
                _refId: 1,
              },
              {
                _refId: 2,
              },
            ],
          },
          {
            levels: [
              {
                _refId: 3,
              },
              {
                _refId: 4,
              },
              {
                _refId: 4,
              },
            ],
          },
        ],
      }).then(
        () => TEST_FAILED,
        () => {
          expect(AppError.badRequest).toHaveBeenCalledWith('The following _refIds are not unique: 4', undefined, '3H2002')
        },
      )
    })

    test('indicates bad request if multiple levels across factors have the same _refId', () => {
      AppError.badRequest = mock()

      return target.preValidate({
        treatmentVariables: [
          {
            levels: [
              {
                _refId: 1,
              },
              {
                _refId: 2,
              },
            ],
          },
          {
            levels: [
              {
                _refId: 3,
              },
              {
                _refId: 2,
              },
            ],
          },
        ],
      }).then(
        () => TEST_FAILED,
        () => {
          expect(AppError.badRequest).toHaveBeenCalledWith('The following _refIds are not unique: 2', undefined, '3H2002')
        },
      )
    })

    test('indicates bad request if there are multiple non-unique _refIds specified for levels', () => {
      AppError.badRequest = mock()

      return target.preValidate({
        treatmentVariables: [
          {
            levels: [
              {
                _refId: 1,
              },
              {
                _refId: 2,
              },
              {
                _refId: 3,
              },
              {
                _refId: 2,
              },
            ],
          },
          {
            levels: [
              {
                _refId: 3,
              },
              {
                _refId: 4,
              },
              {
                _refId: 5,
              },
              {
                _refId: 5,
              },
            ],
          },
        ],
      }).then(
        () => TEST_FAILED,
        () => {
          expect(AppError.badRequest).toHaveBeenCalledWith('The following _refIds are not unique: 2, 3, 5', undefined, '3H2002')
        },
      )
    })

    test('indicates bad request if an independent association references a _refId that does not exist', () => {
      AppError.badRequest = mock()

      return target.preValidate({
        treatmentVariables: [
          {
            levels: [
              {
                _refId: 1,
              },
              {
                _refId: 2,
              },
            ],
          },
          {
            levels: [
              {
                _refId: 3,
              },
              {
                _refId: 4,
              },
            ],
          },
        ],
        treatmentVariableAssociations: [
          {
            associatedLevelRefId: 99,
            nestedLevelRefId: 2,
          },
        ],
      }).then(
        () => TEST_FAILED,
        () => {
          expect(AppError.badRequest).toHaveBeenCalledWith('The following _refIds are referenced within an treatmentVariableAssociation, but the _refId is not valid: 99', undefined, '3H2003')
        },
      )
    })

    test('indicates bad request if multiple independent associations reference a _refId that does not exist', () => {
      AppError.badRequest = mock()

      return target.preValidate({
        treatmentVariables: [
          {
            levels: [
              {
                _refId: 1,
              },
              {
                _refId: 2,
              },
            ],
          },
          {
            levels: [
              {
                _refId: 3,
              },
              {
                _refId: 4,
              },
            ],
          },
        ],
        treatmentVariableAssociations: [
          {
            associatedLevelRefId: 99,
            nestedLevelRefId: 2,
          },
          {
            associatedLevelRefId: 42,
            nestedLevelRefId: 2,
          },
          {
            associatedLevelRefId: 1,
            nestedLevelRefId: 42,
          },
          {
            associatedLevelRefId: 1,
            nestedLevelRefId: 99,
          },
        ],
      }).then(
        () => TEST_FAILED,
        () => {
          expect(AppError.badRequest).toHaveBeenCalledWith('The following _refIds are referenced within an treatmentVariableAssociation, but the _refId is not valid: 42, 99', undefined, '3H2003')
        },
      )
    })

    test('indicates bad request if a duplicate relationship exists within the independent associations', () => {
      AppError.badRequest = mock()

      return target.preValidate({
        treatmentVariables: [
          {
            levels: [
              {
                _refId: 1,
              },
              {
                _refId: 2,
              },
            ],
          },
          {
            levels: [
              {
                _refId: 3,
              },
              {
                _refId: 4,
              },
            ],
          },
        ],
        treatmentVariableAssociations: [
          {
            associatedLevelRefId: 1,
            nestedLevelRefId: 3,
          },
          {
            associatedLevelRefId: 2,
            nestedLevelRefId: 4,
          },
          {
            associatedLevelRefId: 1,
            nestedLevelRefId: 3,
          },
        ],
      }).then(
        () => TEST_FAILED,
        () => {
          expect(AppError.badRequest).toHaveBeenCalledWith('The following treatment variable associations are not unique: {associatedLevelRefId: 1, nestedLevelRefId: 3}', undefined, '3H2004')
        },
      )
    })

    test('indicates bad request if multiple duplicate relationships exists within the independent associations', () => {
      AppError.badRequest = mock()

      return target.preValidate({
        treatmentVariables: [
          {
            levels: [
              {
                _refId: 1,
              },
              {
                _refId: 2,
              },
            ],
          },
          {
            levels: [
              {
                _refId: 3,
              },
              {
                _refId: 4,
              },
            ],
          },
        ],
        treatmentVariableAssociations: [
          {
            associatedLevelRefId: 1,
            nestedLevelRefId: 3,
          },
          {
            associatedLevelRefId: 2,
            nestedLevelRefId: 4,
          },
          {
            associatedLevelRefId: 1,
            nestedLevelRefId: 3,
          },
          {
            associatedLevelRefId: 1,
            nestedLevelRefId: 3,
          },
          {
            associatedLevelRefId: 2,
            nestedLevelRefId: 4,
          },
        ],
      }).then(
        () => TEST_FAILED,
        () => {
          expect(AppError.badRequest).toHaveBeenCalledWith('The following treatment variable associations are not unique: {associatedLevelRefId: 1, nestedLevelRefId: 3}, {associatedLevelRefId: 2, nestedLevelRefId: 4}', undefined, '3H2004')
        },
      )
    })

    test('indicates a bad request when nesting occurs within a factor', () => {
      AppError.badRequest = mock()

      return target.preValidate({
        treatmentVariables: [
          {
            levels: [
              {
                _refId: 1,
              },
              {
                _refId: 2,
              },
            ],
          },
          {
            levels: [
              {
                _refId: 3,
              },
              {
                _refId: 4,
              },
            ],
          },
        ],
        treatmentVariableAssociations: [
          {
            associatedLevelRefId: 1,
            nestedLevelRefId: 2,
          },
        ],
      }).then(
        () => TEST_FAILED,
        () => {
          expect(AppError.badRequest).toHaveBeenCalledWith('Nesting levels within a single treatment variable is not allowed.  The following associations violate this: {associatedLevelRefId: 1, nestedLevelRefId: 2}', undefined, '3H2005')
        },
      )
    })

    test('resolves when request is valid', () => {
      AppError.badRequest = mock()

      return target.preValidate({
        treatmentVariables: [
          {
            levels: [
              {
                _refId: 1,
              },
              {
                _refId: 2,
              },
            ],
          },
          {
            levels: [
              {
                _refId: 3,
              },
              {
                _refId: 4,
              },
            ],
          },
        ],
        treatmentVariableAssociations: [
          {
            associatedLevelRefId: 1,
            nestedLevelRefId: 3,
          },
          {
            associatedLevelRefId: 2,
            nestedLevelRefId: 4,
          },
        ],
      }).then(() => {
        expect(AppError.badRequest).not.toHaveBeenCalledWith()
      })
    })
  })

  describe('validateEntity', () => {
    test('resolves when all independent variables have at least one level', () => {
      const variables = {
        treatmentVariables: [
          {
            levels: [{}],
          },
        ],
      }
      return target.validateEntity(variables).then(() => {
        expect(target.hasErrors()).toEqual(false)
      })
    })

    test('resolves when no independent variables specified', () => {
      const variables = {
        treatmentVariables: [],
      }
      return target.validateEntity(variables).then(() => {
        expect(target.hasErrors()).toEqual(false)
      })
    })

    test('resolves when independent variables property omitted', () => {
      const variables = {}
      return target.validateEntity(variables).then(() => {
        expect(target.hasErrors()).toEqual(false)
      })
    })

    test('pushes message when at least one independent variable has no levels', () => {
      const variables = {
        treatmentVariables: [
          {
            levels: [{}],
          },
          {
            levels: [],
          },
        ],
      }
      return target.validateEntity(variables).then(() => {
        expect(target.hasErrors()).toEqual(true)
        expect(target.messages[0]).toEqual({ message: 'Treatment variables must contain at least one level.', errorCode: '3H3001' })
      })
    })
  })
})
