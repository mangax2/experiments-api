import { mockResolve, mock } from '../jestUtil'
import loaders from '../../src/graphql/loaders'
import { dbRead } from '../../src/db/DbManager'

describe('loaders', () => {
  const testTx = { tx: {} }
  const experiment = { id: 1, is_template: false }
  const template = { id: 2, is_template: true }

  beforeEach(() => {
    dbRead.experiments = { all: mock() }
  })

  describe('experimentBatchLoaderCallback', () => {
    describe('allows templates', () => {
      test('finds experiment', () => {
        dbRead.experiments.batchFind = mockResolve([experiment])

        return loaders.experimentBatchLoaderCallback([{ id: experiment.id, allowTemplate: true }], testTx).then((data) => {
          expect(data).toEqual([experiment])
        })
      })
    })

    test('finds template', () => {
      dbRead.experiments.batchFind = mockResolve([template])

      return loaders.experimentBatchLoaderCallback([{ id: template.id, allowTemplate: true }], testTx).then((data) => {
        expect(data).toEqual([template])
      })
    })

    test('does not find experiment', () => {
      dbRead.experiments.batchFind = mockResolve([null])

      return loaders.experimentBatchLoaderCallback([{ id: experiment.id, allowTemplate: true }], testTx).then((data) => {
        expect(data).toEqual([null])
      })
    })

    test('handles batch', () => {
      dbRead.experiments.batchFind = mockResolve([experiment, template])

      return loaders.experimentBatchLoaderCallback(
        [{ id: experiment.id, allowTemplate: true }, { id: template.id, allowTemplate: true }], testTx,
      ).then((data) => {
        expect(data).toEqual([experiment, template])
      })
    })
  })

  describe('does not allow templates', () => {
    test('finds experiment', () => {
      dbRead.experiments.batchFind = mockResolve([experiment])

      return loaders.experimentBatchLoaderCallback([{ id: experiment.id, allowTemplate: false }], testTx).then((data) => {
        expect(data).toEqual([experiment])
      })
    })

    test('finds template but does not return it', () => {
      dbRead.experiments.batchFind = mockResolve([template])

      return loaders.experimentBatchLoaderCallback([{ id: template.id, allowTemplate: false }], testTx).then((data) => {
        expect(data).toEqual([null])
      })
    })
  })
})
