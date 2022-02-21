import chemApSyncInputSchemaValidate from '../../src/validations/chemApSyncValidator'
import AppError from '../../src/services/utility/AppError'
import { mock } from '../jestUtil'

describe('chemApSyncValidator', () => {
  describe('chemApSyncInputSchemaValidate', () => {
    test('validation should fail when experiment Id in the input body is less than 1', async () => {
      AppError.badRequest = mock('')
      try {
        await chemApSyncInputSchemaValidate({ experimentId: 0 })
        // eslint-disable-next-line no-empty
      } catch (e) {}
      expect(AppError.badRequest).toHaveBeenCalled()
    })

    test('validation should fail when experiment Id is missing in the input body', async () => {
      AppError.badRequest = mock('')
      try {
        await chemApSyncInputSchemaValidate({})
        // eslint-disable-next-line no-empty
      } catch (e) {}
      expect(AppError.badRequest).toHaveBeenCalled()
    })

    test('validation should succeed when experiment id is greater than 0 in the input body', async () => {
      AppError.badRequest = mock('')
      await chemApSyncInputSchemaValidate({ experimentId: 1 })
      expect(AppError.badRequest).not.toHaveBeenCalled()
    })
  })
})
