import _ from 'lodash'
import db from '../db/DbManager'
import Transactional from '../decorators/transactional'
import setErrorDecorator from '../decorators/setErrorDecorator'
import { SCHEMA, COLITEM } from '../envision/schema'

const { setErrorCode } = setErrorDecorator()

// Error Codes 1VXXXX
class EnvisionDatasetsService {
  @setErrorCode('1V1000')
  @Transactional('GetDataForEnvisionDatasets')
  getDataForEnvisionDatasets(id, context, tx) {
    return db.envisionDatasets.getDataForEnvisionDatasets(id, context, tx)
      .then(data => this.formatData(data))
  }

  @setErrorCode('1V2000')
  @Transactional('getSchemaForEnvisionDatasets')
  getSchemaForEnvisionDatasets(id, context, tx) {
    return db.envisionDatasets.getDataForEnvisionDatasets(id, context, tx)
      .then(data => this.generateSchema(data))
  }

  @setErrorCode('1V3000')
  formatData = (data) => {
    const factorRecords = this.buildFactorRecords(data)
    _.forEach(data, (d) => {
      _.forEach(d.factors, (f) => {
        const record = _.find(factorRecords, r => r.label === f.factor)
        if (!_.isNil(record)) {
          d[record.name] = f
          this.updateFactorItemsData(f.level, f.level, record)
        }
        if (!_.isNil(f.level)) {
          delete f.level.items
        }
      })
      delete d.factors
    })
    return data
  }

  @setErrorCode('1V4000')
  generateSchema = (data) => {
    if (!_.isNil(data) && !_.isEmpty(data)) {
      const schema = JSON.parse(JSON.stringify(SCHEMA))
      schema.pageHeader = `Experiment ${data[0].experiment_id}`
      schema.table.columns = schema.table.columns.concat(this.generateFactorColumnSchema(data))
      return schema
    }

    return null
  }

  @setErrorCode('1V5000')
  generateFactorColumnSchema = (data) => {
    const factorRecords = this.buildFactorRecords(data)
    return this.createFactorColumnSchema(factorRecords)
  }

  @setErrorCode('1V6000')
  buildFactorRecords = (data) => {
    const records = []
    _.forEach(data, d => this.updateFactorRecords(records, d.factors))

    return records
  }

  @setErrorCode('1V7000')
  updateFactorRecords = (records, factors) => {
    _.forEach(factors, (f) => {
      if (!_.isNil(f.factor)) {
        let record = _.find(records, item => item.label === f.factor)
        if (_.isNil(record)) {
          const n = this.addNewRecord(records, 'factor', objPropName => ({
            name: objPropName,
            label: f.factor,
            prop: `${objPropName}.factor`,
            items: [],
          }))
          record = Object.assign({}, n)
        }
        this.updateFactorItemsRecords([], f.level, record.name, record)
      }
    })
  }

  @setErrorCode('1V8000')
  updateFactorItemsRecords = (existingItems, parent, factorPropName, factorRecord) => {
    _.forEach(parent.items, (i) => {
      if (!_.isNil(i.items)) {
        this.updateFactorItemsRecords(existingItems, i, factorPropName, factorRecord)
      } else {
        let record = _.find(factorRecord.items, item => (
          item.label === i.label && !_.some(existingItems, s => s === item.name)
        ))
        if (_.isNil(record)) {
          const n = this.addNewRecord(factorRecord.items, 'item', objPropName => ({
            name: objPropName,
            label: i.label,
            prop: `${factorPropName}.level.${objPropName}`,
          }))
          record = Object.assign({}, n)
        }
        existingItems.push(record.name)
      }
    })
  }

  @setErrorCode('1V9000')
  updateFactorItemsData = (root, parent, factorRecord) => {
    _.forEach(parent.items, (i) => {
      if (!_.isNil(i.items)) {
        this.updateFactorItemsData(root, i, factorRecord)
      } else {
        const record = _.find(factorRecord.items,
          item => item.label === i.label && _.isNil(root[item.name]))

        if (!_.isNil(record)) {
          if (i.objectType === 'Catalog' && !_.isNil(i.catalogType)) {
            i.objectType = `${i.catalogType} Catalog`
          }
          root[record.name] = i
        }
      }
    })
  }

  @setErrorCode('1VA000')
  addNewRecord = (records, name, createRecordFunc) => {
    const objPropName = this.getNextObjPropName(records, name)
    const record = createRecordFunc(objPropName)
    records.push(record)

    return record
  }

  @setErrorCode('1VB000')
  getNextObjPropName = (record, name) => {
    const count = record.length + 1
    return name + count
  }


  @setErrorCode('1VC000')
  createFactorColumnSchema = (factorDataRecords) => {
    const schema = []
    _.forEach(factorDataRecords, (p) => {
      this.createColumnItemSchema(`variable: ${p.label}`, p.prop, schema)
      _.forEach(p.items, (i) => {
        this.createColumnItemSchema(`property: ${i.label}`, `${i.prop}.text`, schema)
        this.createColumnItemSchema(`${i.label}: Data Source`, `${i.prop}.objectType`, schema)
      })
    })

    return schema
  }

  @setErrorCode('1VD000')
  createColumnItemSchema = (heading, name, schema) => {
    const item = JSON.parse(JSON.stringify(COLITEM))
    item.heading = heading
    item.name = name
    schema.push(item)
  }
}

module.exports = EnvisionDatasetsService
