import { mock } from '../jestUtil'
import resolvers from '../../src/graphql/resolvers'
import cfServices from '../../src/services/utility/ServiceConfig'

describe('resolvers', () => {
  let loadMock
  let context

  beforeEach(() => {
    cfServices.experimentApiConfigurables = {
      maxExperimentsToRetrieve: 10,
    }
    loadMock = mock()
    context = {
      loaders: {
        experiment: {
          load: loadMock,
        },
      },
    }
    expect.hasAssertions()
  })

  describe('Query', () => {
    describe('getExperimentsByIds', () => {
      test('Throws exception when request ids length exceeds max length', () => {
        const ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]

        expect(() => resolvers.Query.getExperimentsByIds(undefined, { ids }, context))
          .toThrow('Request input ids exceeded the maximum length of 10')
      })

      test('Does not throw exception when Request ids length is exactly max length', () => {
        const ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

        expect(() => resolvers.Query.getExperimentsByIds(undefined, { ids }, context))
          .not.toThrow()
      })

      test('Does not throw exception when Request ids length is less than max length', () => {
        const ids = [1, 2]

        expect(() => resolvers.Query.getExperimentsByIds(undefined, { ids }, context))
          .not.toThrow()
      })

      test('loads each id', () => {
        const ids = [1, 2]

        return resolvers.Query.getExperimentsByIds(undefined, { ids, allowTemplate: true }, context).then(() => {
          expect(loadMock).toHaveBeenCalledTimes(2)
          expect(loadMock).toHaveBeenCalledWith({ id: 1, allowTemplate: true })
          expect(loadMock).toHaveBeenCalledWith({ id: 2, allowTemplate: true })
        })
      })

      test('only loads unique ids', () => {
        const ids = [1, 2, 2, 2, 1, 1]

        return resolvers.Query.getExperimentsByIds(undefined, { ids, allowTemplate: true }, context).then(() => {
          expect(loadMock).toHaveBeenCalledTimes(2)
          expect(loadMock).toHaveBeenCalledWith({ id: 1, allowTemplate: true })
          expect(loadMock).toHaveBeenCalledWith({ id: 2, allowTemplate: true })
        })
      })

      test('removes nulls from returned array due to not finding the experiment for the given id', () => {
        const ids = [1, 2, 3]
        loadMock.mockReturnValueOnce(1).mockReturnValueOnce(null).mockReturnValueOnce(2)

        return resolvers.Query.getExperimentsByIds(undefined, { ids }, context).then((data) => {
          expect(data).toEqual([1, 2])
        })
      })
    })
  })
})
