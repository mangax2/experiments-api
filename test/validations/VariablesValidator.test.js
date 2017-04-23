import VariablesValidator from '../../src/validations/VariablesValidator'
import db from '../../src/db/DbManager'

describe('VariablesValidator', () => {
  let target

  beforeEach(() => {
    target = new VariablesValidator()
  })

  describe('get Schema', () => {
    it('gets the schema', () => {
      db.experiments = {}
      const schema = [
        {paramName: 'experimentId', type: 'numeric', required: true},
        {paramName: 'experimentId', type: 'refData', entity: db.experiments}
      ]

      expect(VariablesValidator.SCHEMA).toEqual(schema)
    })
  })

  describe('getSchema', () => {
    it('returns the schema', () => {
      db.experiments = {}
      const schema = [
        {paramName: 'experimentId', type: 'numeric', required: true},
        {paramName: 'experimentId', type: 'refData', entity: db.experiments}
      ]

      expect(target.getSchema()).toEqual(schema)
    })
  })

  describe('postValidate', () => {
    it('resolves', () => {
      return target.postValidate().then(() => {
      })
    })
  })
})