import _ from 'lodash'
import EnvisionDatasetsService from '../../src/services/EnvisionDatasetsService'
import db from '../../src/db/DbManager'
import { mock, mockResolve } from '../jestUtil'

describe('EnvisionDatasetsService', () => {
  const records = []
  const data = []
  const testContext = {}
  const testTx = { tx: {} }

  beforeEach(() => {
    records.push({
      name: 'factor1', label: 'GM', prop: 'factor1.factor', items: [],
    })
    records.push({
      name: 'factor2', label: 'Spray', prop: 'factor2.factor', items: [],
    })
    records[0].items.push({
      name: 'item1', label: 'GM', prop: 'factor1.level.item1',
    })
    records[1].items.push({
      name: 'item1', label: 'Rate', prop: 'factor2.level.item1',
    })
    records[1].items.push({
      name: 'item2', label: 'Name', prop: 'factor2.level.item2',
    })
    records[1].items.push({
      name: 'item3', label: 'Rate', prop: 'factor2.level.item3',
    })
    records[1].items.push({
      name: 'item4', label: 'Name', prop: 'factor2.level.item4',
    })

    data.push({
      experiment_id: 111,
      name: 'testExperiment',
      factors: [],
    })
    data[0].factors.push(({ level: { items: [] }, factor: 'GM' }))
    data[0].factors[0].level.items.push({
      text: 'GM_A21542726',
      label: 'GM',
      objectType: 'Catalog',
      catalogType: 'chemical',
    })
    data[0].factors.push(({ level: { items: [] }, factor: 'Spray' }))
    data[0].factors[1].level.items.push({
      text: '2x',
      label: 'Rate',
      objectType: 'Other',
    })
    data[0].factors[1].level.items.push({
      text: 'Clarity',
      label: 'Name',
      objectType: 'Other',
    })
    data[0].factors.push({ level: null, factor: null })
    data.push({
      experimentId: 111,
      name: 'testExperiment',
      factors: [],
    })
    data[1].factors.push(({ level: { items: [] }, factor: 'GM' }))
    data[1].factors[0].level.items.push({
      text: 'GM_A21543023',
      label: 'GM',
      objectType: 'Catalog',
      catalogType: 'chemical',
    })
    data[1].factors.push(({ level: { items: [] }, factor: 'Spray' }))
    data[1].factors[1].level.items.push({ items: [] })
    data[1].factors[1].level.items[0].items.push({
      text: '2x',
      label: 'Rate',
      objectType: 'Other',
    })
    data[1].factors[1].level.items[0].items.push({
      text: 'Clarity',
      label: 'Name',
      objectType: 'Other',
    })
    data[1].factors[1].level.items.push({ items: [] })
    data[1].factors[1].level.items[1].items.push({
      text: '2x',
      label: 'Rate',
      objectType: 'Other',
    })
    data[1].factors[1].level.items[1].items.push({
      text: 'Interlock',
      label: 'Name',
      objectType: 'Other',
    })
  })

  afterEach(() => {
    records.splice(0, records.length)
    data.splice(0, data.length)
  })

  describe('GetDataForEnvisionDatasets', () => {
    test('test', () => {
      const target = new EnvisionDatasetsService()
      db.envisionDatasets.getDataForEnvisionDatasets = mockResolve()
      target.formatData = mock({})

      return target.getDataForEnvisionDatasets(testContext, testTx)
        .then((result) => {
          expect(result).toEqual({})
          expect(db.envisionDatasets.getDataForEnvisionDatasets).toHaveBeenCalledTimes(1)
          expect(target.formatData).toHaveBeenCalledTimes(1)
        })
    })
  })

  describe('getSchemaForEnvisionDatasets', () => {
    test('test', () => {
      const target = new EnvisionDatasetsService()
      db.envisionDatasets.getDataForEnvisionDatasets = mockResolve()

      return target.getSchemaForEnvisionDatasets(testContext, testTx)
        .then((schema) => {
          expect(schema).toEqual(null)
          expect(db.envisionDatasets.getDataForEnvisionDatasets).toHaveBeenCalledTimes(1)
        })
    })
  })

  describe('formatData', () => {
    test('generate input data for envision dataset', () => {
      const target = new EnvisionDatasetsService()
      const input = target.formatData(data)
      expect(input[0].factor1).toHaveProperty('factor', 'GM')
      expect(input[0].factor1.level).toHaveProperty('item1', {
        text: 'GM_A21542726',
        label: 'GM',
        objectType: 'chemical Catalog',
        catalogType: 'chemical',
      })
      expect(input[0].factor2).toHaveProperty('factor', 'Spray')
      expect(input[0].factor2.level).toHaveProperty('item1', {
        text: '2x',
        label: 'Rate',
        objectType: 'Other',
      })
      expect(input[0].factor2.level).toHaveProperty('item2', {
        text: 'Clarity',
        label: 'Name',
        objectType: 'Other',
      })
      expect(input[1].factor1).toHaveProperty('factor', 'GM')
      expect(input[1].factor1.level).toHaveProperty('item1', {
        text: 'GM_A21543023',
        label: 'GM',
        objectType: 'chemical Catalog',
        catalogType: 'chemical',
      })
      expect(input[1].factor2).toHaveProperty('factor', 'Spray')
      expect(input[1].factor2.level).toHaveProperty('item1', {
        text: '2x',
        label: 'Rate',
        objectType: 'Other',
      })
      expect(input[1].factor2.level).toHaveProperty('item2', {
        text: 'Clarity',
        label: 'Name',
        objectType: 'Other',
      })
      expect(input[1].factor2.level).toHaveProperty('item3', {
        text: '2x',
        label: 'Rate',
        objectType: 'Other',
      })
      expect(input[1].factor2.level).toHaveProperty('item4', {
        text: 'Interlock',
        label: 'Name',
        objectType: 'Other',
      })
    })

    test('mismatch of data and record', () => {
      const target = new EnvisionDatasetsService()
      target.buildFactorRecords = mock([])
      const input = target.formatData(data)
      expect(input[0].factor1).toEqual(undefined)
      expect(input[0].factor2).toEqual(undefined)
      expect(input[1].factor1).toEqual(undefined)
      expect(input[1].factor2).toEqual(undefined)
    })
  })

  describe('generateSchema', () => {
    test('generate envision dataset schema', () => {
      const target = new EnvisionDatasetsService()
      const schema = target.generateSchema(data)
      expect(schema.pageHeader).toBe('Experiment 111')
      expect(schema.table.allowDelete).toBe(false)
      expect(schema.table.columns).toContainEqual({
        dataFilter: true,
        heading: 'experiment name',
        editable: false,
        dataType: 'String',
        name: 'name',
        width: '200',
        dataSort: true,
        filterType: 'select',
        hideInitially: false,
      })
    })

    test('generate envision dataset schema for invalid data', () => {
      const target = new EnvisionDatasetsService()
      expect(target.generateSchema([])).toBe(null)
      expect(target.generateSchema(null)).toBe(null)
      expect(target.generateSchema(undefined)).toBe(null)
    })
  })

  describe('generateFactorColumnSchema', () => {
    test('generate column schema for factors', () => {
      const target = new EnvisionDatasetsService()
      const schema = target.generateFactorColumnSchema(data)
      expect(schema).toContainEqual({
        dataFilter: true,
        heading: 'variable: Spray',
        editable: false,
        dataType: 'String',
        name: 'factor2.factor',
        width: '200',
        dataSort: true,
        filterType: 'select',
        hideInitially: false,
      })
      expect(schema).toContainEqual({
        dataFilter: true,
        heading: 'property: Rate',
        editable: false,
        dataType: 'String',
        name: 'factor2.level.item1.text',
        width: '200',
        dataSort: true,
        filterType: 'select',
        hideInitially: false,
      })
      expect(schema).toContainEqual({
        dataFilter: true,
        heading: 'property: Rate',
        editable: false,
        dataType: 'String',
        name: 'factor2.level.item3.text',
        width: '200',
        dataSort: true,
        filterType: 'select',
        hideInitially: false,
      })
    })
  })

  describe('buildFactorRecords', () => {
    test('build records based on data', () => {
      const target = new EnvisionDatasetsService()
      expect(target.buildFactorRecords(data)).toMatchObject(records)
    })
  })

  describe('updateFactorRecords', () => {
    test('build factor records based on data', () => {
      const target = new EnvisionDatasetsService()
      const newRecords = []
      _.forEach(data, d => target.updateFactorRecords(newRecords, d.factors))
      expect(newRecords).toMatchObject(records)
    })
  })

  describe('updateFactorItemsRecords', () => {
    test('mulitiple factors with mulitple properties and multi-line items', () => {
      const target = new EnvisionDatasetsService()
      const newRecords = JSON.parse(JSON.stringify(records))
      _.forEach(newRecords, (r) => { r.items = [] })
      target.updateFactorItemsRecords([], data[0].factors[0].level, 'factor1', newRecords[0])
      target.updateFactorItemsRecords([], data[0].factors[1].level, 'factor2', newRecords[1])
      target.updateFactorItemsRecords([], data[1].factors[0].level, 'factor1', newRecords[0])
      target.updateFactorItemsRecords([], data[1].factors[1].level, 'factor2', newRecords[1])
      expect(newRecords).toMatchObject(records)
    })
  })

  describe('updateFactorItemsData', () => {
    test('update factor data of single line items, single property', () => {
      const target = new EnvisionDatasetsService()
      const { level } = data[0].factors[0]
      target.updateFactorItemsData(level, level, records[0])
      expect(level).toHaveProperty('item1', {
        text: 'GM_A21542726',
        label: 'GM',
        objectType: 'chemical Catalog',
        catalogType: 'chemical',
      })
    })

    test('mismatch of record and data', () => {
      const target = new EnvisionDatasetsService()
      const { level } = data[0].factors[0]
      target.updateFactorItemsData(level, level, records[1])
      expect(level).not.toHaveProperty('item1', {
        text: 'GM_A21542726',
        label: 'GM',
        objectType: 'chemical Catalog',
        catalogType: 'chemical',
      })
    })

    test('update factor data of single line items, multiple properties', () => {
      const target = new EnvisionDatasetsService()
      const { level } = data[0].factors[1]
      target.updateFactorItemsData(level, level, records[1])
      expect(level).toHaveProperty('item1', {
        text: '2x',
        label: 'Rate',
        objectType: 'Other',
      })
      expect(level).toHaveProperty('item2', {
        text: 'Clarity',
        label: 'Name',
        objectType: 'Other',
      })
    })

    test('update factor data of multi-line items, multiple properties', () => {
      const target = new EnvisionDatasetsService()
      const { level } = data[1].factors[1]
      target.updateFactorItemsData(level, level, records[1])
      expect(level).toHaveProperty('item1', {
        text: '2x',
        label: 'Rate',
        objectType: 'Other',
      })
      expect(level).toHaveProperty('item2', {
        text: 'Clarity',
        label: 'Name',
        objectType: 'Other',
      })
      expect(level).toHaveProperty('item3', {
        text: '2x',
        label: 'Rate',
        objectType: 'Other',
      })
      expect(level).toHaveProperty('item4', {
        text: 'Interlock',
        label: 'Name',
        objectType: 'Other',
      })
    })
  })

  describe('addNewRecord', () => {
    test('add a new factor, RM with a property RM', () => {
      const target = new EnvisionDatasetsService()
      target.addNewRecord(records, 'factor', objPropName => ({
        name: objPropName,
        label: 'RM',
        prop: `${objPropName}.factor`,
        items: [],
      }))
      expect(records.length).toBe(3)
      expect(records[2].name).toBe('factor3')
      expect(records[2].label).toBe('RM')
      expect(records[2].prop).toBe('factor3.factor')

      target.addNewRecord(records[2].items, 'item', objPropName => ({
        name: objPropName,
        label: 'RM',
        prop: `factor3.level.${objPropName}`,
        value: 'A',
      }))
      expect(records.length).toBe(3)
      expect(records[2].items.length).toBe(1)
      expect(records[2].items[0].name).toBe('item1')
      expect(records[2].items[0].label).toBe('RM')
      expect(records[2].items[0].prop).toBe('factor3.level.item1')
      expect(records[2].items[0].value).toBe('A')
    })
  })

  describe('getNextObjPropName', () => {
    test('get next factor object name in data', () => {
      const target = new EnvisionDatasetsService()
      expect(target.getNextObjPropName(records, 'factor')).toBe('factor3')
      expect(target.getNextObjPropName(records[0].items, 'item')).toBe('item2')
      expect(target.getNextObjPropName(records[1].items, 'item')).toBe('item5')
    })
  })

  describe('createFactorColumnSchema', () => {
    test('column schema for two factors are added', () => {
      const target = new EnvisionDatasetsService()

      const schema = target.createFactorColumnSchema(records)
      expect(schema.length).toBe(12)
      expect(schema[0].heading).toBe('variable: GM')
      expect(schema[1].heading).toBe('property: GM')
      expect(schema[2].heading).toBe('GM: Data Source')
      expect(schema[3].heading).toBe('variable: Spray')
      expect(schema[4].heading).toBe('property: Rate')
      expect(schema[5].heading).toBe('Rate: Data Source')
      expect(schema[6].heading).toBe('property: Name')
      expect(schema[7].heading).toBe('Name: Data Source')
      expect(schema[8].heading).toBe('property: Rate')
      expect(schema[9].heading).toBe('Rate: Data Source')
      expect(schema[6].heading).toBe('property: Name')
      expect(schema[7].heading).toBe('Name: Data Source')
    })
  })

  describe('createColumnItemSchema', () => {
    test('a table column schema is added', () => {
      const target = new EnvisionDatasetsService()
      const schema = []
      target.createColumnItemSchema('testfactor', 'factor.factor1', schema)
      expect(schema.length).toBe(1)
      expect(schema[0].heading).toBe('testfactor')
      expect(schema[0].name).toBe('factor.factor1')
    })
  })
})
