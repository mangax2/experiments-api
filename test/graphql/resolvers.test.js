import { mock } from '../jestUtil'
import resolvers from '../../src/graphql/resolvers'

describe('resolvers', () => {
  let experimentLoadMock
  let templateLoadMock
  let experimentsLoadMock
  let templatesLoadMock
  let setsLoadMock
  let criteriaLoadMock
  let nameLoadMock
  let setsByIdMock
  let context

  beforeEach(() => {
    experimentLoadMock = mock()
    templateLoadMock = mock()
    experimentsLoadMock = mock()
    templatesLoadMock = mock()
    setsLoadMock = mock()
    criteriaLoadMock = mock()
    nameLoadMock = mock()
    setsByIdMock = mock()
    context = {
      loaders: {
        experiment: {
          load: experimentLoadMock,
        },
        template: {
          load: templateLoadMock,
        },
        experiments: {
          load: experimentsLoadMock,
        },
        templates: {
          load: templatesLoadMock,
        },
        experimentBySetId: {
          load: setsLoadMock,
        },
        experimentsByCriteria: {
          load: criteriaLoadMock,
        },
        experimentsByPartialName: {
          load: nameLoadMock,
        },
        setsBySetIds: {
          load: setsByIdMock,
        },
      },
    }
  })

  describe('Query', () => {
    describe('getSets', () => {
      test('getSets', () => {
        const args = {
          setIds: [1, 2, 3],
        }

        resolvers.Query.getSets(undefined, args, context)
        expect(setsByIdMock).toHaveBeenCalledTimes(1)
        expect(setsByIdMock).toHaveBeenCalledWith(args.setIds)
      })

      test('getSetsInfo', () => {
        const args = {
          setIds: [1, 2, 3],
        }

        resolvers.Query.getSetsInfo(undefined, args, context)
        expect(setsByIdMock).toHaveBeenCalledTimes(1)
        expect(setsByIdMock).toHaveBeenCalledWith(args.setIds)
      })

      test('getSets obeys limit of ids (10 atm)', () => {
        const args = {
          setIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        }

        expect(() => resolvers.Query.getSetsInfo(undefined, args, context))
          .toThrow('Request input ids exceeded the maximum length of 10')
      })
    })

    describe('getExperiments', () => {
      test('loads each id', () => {
        const args = {
          values: [1, 2],
          criteria: 'experimentId',
          acceptType: ['experiments', 'templates'],
        }

        return resolvers.Query.getExperiments(undefined, args, context).then(() => {
          expect(experimentLoadMock).toHaveBeenCalledTimes(2)
          expect(experimentLoadMock).toHaveBeenCalledWith({ id: 1, allowTemplate: true })
          expect(experimentLoadMock).toHaveBeenCalledWith({ id: 2, allowTemplate: true })
        })
      })

      test('only loads unique ids', () => {
        const args = {
          values: [1, 2, 2, 2, 1, 1],
          criteria: 'experimentId',
          acceptType: ['experiments', 'templates'],
        }

        return resolvers.Query.getExperiments(undefined, args, context).then(() => {
          expect(experimentLoadMock).toHaveBeenCalledTimes(2)
          expect(experimentLoadMock).toHaveBeenCalledWith({ id: 1, allowTemplate: true })
          expect(experimentLoadMock).toHaveBeenCalledWith({ id: 2, allowTemplate: true })
        })
      })

      test('works when we go after templates only', () => {
        const args = {
          values: [1, 2],
          criteria: 'experimentId',
          acceptType: ['templates'],
        }

        return resolvers.Query.getExperiments(undefined, args, context).then(() => {
          expect(templateLoadMock).toHaveBeenCalledTimes(2)
          expect(templateLoadMock).toHaveBeenCalledWith(1)
          expect(templateLoadMock).toHaveBeenCalledWith(2)
        })
      })

      test('removes nulls from returned array due to not finding the experiment for the given id', () => {
        const args = {
          values: [1, 2, 3],
          criteria: 'experimentId',
          acceptType: ['experiments'],
          allowTemplate: true,
        }
        experimentLoadMock.mockReturnValueOnce(1).mockReturnValueOnce(null).mockReturnValueOnce(2)

        return resolvers.Query.getExperiments(undefined, args, context).then((data) => {
          expect(data).toEqual({ pageResults: [1, 2], pageResultsLength: 2, totalResultsLength: 2 })
        })
      })

      test('limit and offset properly apply the pagination', () => {
        const args = {
          values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
          criteria: 'experimentId',
          acceptType: ['experiments'],
          allowTemplate: true,
          limit: 6,
          offset: 3,
        }
        experimentLoadMock.mockReturnValueOnce(1).mockReturnValueOnce(2).mockReturnValueOnce(3)
          .mockReturnValueOnce(4)
          .mockReturnValueOnce(5)
          .mockReturnValueOnce(6)
          .mockReturnValueOnce(7)
          .mockReturnValueOnce(8)
          .mockReturnValueOnce(9)
          .mockReturnValueOnce(10)
          .mockReturnValueOnce(11)
          .mockReturnValueOnce(12)

        return resolvers.Query.getExperiments(undefined, args, context).then((data) => {
          expect(data).toEqual({ pageResults: [4, 5, 6, 7, 8, 9], pageResultsLength: 6, totalResultsLength: 12 })
        })
      })

      test('works when we go after all experiments', () => {
        const args = {
          criteria: null,
          acceptType: ['experiments'],
        }

        return resolvers.Query.getExperiments(undefined, args, context).then(() => {
          expect(experimentsLoadMock).toHaveBeenCalledTimes(1)
          expect(experimentsLoadMock).toHaveBeenCalledWith(-1)
        })
      })

      test('works when we go after all templates', () => {
        const args = {
          criteria: null,
          acceptType: ['templates'],
        }

        return resolvers.Query.getExperiments(undefined, args, context).then(() => {
          expect(templatesLoadMock).toHaveBeenCalledTimes(1)
          expect(templatesLoadMock).toHaveBeenCalledWith(-1)
        })
      })

      test('works when we go after all templates and experiments', () => {
        const args = {
          criteria: null,
          acceptType: ['templates', 'experiments'],
        }

        return resolvers.Query.getExperiments(undefined, args, context).then(() => {
          expect(templatesLoadMock).toHaveBeenCalledTimes(1)
          expect(templatesLoadMock).toHaveBeenCalledWith(-1)
          expect(experimentsLoadMock).toHaveBeenCalledTimes(1)
          expect(experimentsLoadMock).toHaveBeenCalledWith(-1)
        })
      })

      test('works when we go after some experiments by set id', () => {
        const args = {
          values: [1, 2],
          criteria: 'setId',
          acceptType: ['experiments'],
        }

        return resolvers.Query.getExperiments(undefined, args, context).then(() => {
          expect(setsLoadMock).toHaveBeenCalledTimes(2)
          expect(setsLoadMock).toHaveBeenCalledWith(1)
          expect(setsLoadMock).toHaveBeenCalledWith(2)
        })
      })

      test('works when we go after an experiment by owner', () => {
        const args = {
          criteriaValue: 'egoby',
          criteria: 'owner',
          acceptType: ['experiments'],
        }

        return resolvers.Query.getExperiments(undefined, args, context).then(() => {
          expect(criteriaLoadMock).toHaveBeenCalledTimes(1)
          expect(criteriaLoadMock).toHaveBeenCalledWith({ criteria: 'owner', value: ['egoby'], isTemplate: false })
        })
      })

      test('works when we go after a template by owner', () => {
        const args = {
          criteriaValue: 'egoby',
          criteria: 'owner',
          acceptType: ['templates'],
        }

        return resolvers.Query.getExperiments(undefined, args, context).then(() => {
          expect(criteriaLoadMock).toHaveBeenCalledTimes(1)
          expect(criteriaLoadMock).toHaveBeenCalledWith({ criteria: 'owner', value: ['egoby'], isTemplate: true })
        })
      })

      test('works when we go after an experiment by name', () => {
        const args = {
          criteriaValue: 'germplasm',
          criteria: 'name',
          acceptType: ['experiments'],
        }

        return resolvers.Query.getExperiments(undefined, args, context).then(() => {
          expect(nameLoadMock).toHaveBeenCalledTimes(1)
          expect(nameLoadMock).toHaveBeenCalledWith({ name: 'germplasm', isTemplate: false })
        })
      })

      test('works when we go after a template by name', () => {
        const args = {
          criteriaValue: 'germplasm',
          criteria: 'name',
          acceptType: ['templates'],
        }

        return resolvers.Query.getExperiments(undefined, args, context).then(() => {
          expect(nameLoadMock).toHaveBeenCalledTimes(1)
          expect(nameLoadMock).toHaveBeenCalledWith({ name: 'germplasm', isTemplate: true })
        })
      })
    })
  })
})
