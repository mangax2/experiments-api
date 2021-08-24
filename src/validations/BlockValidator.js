import _ from 'lodash'
import SchemaValidator from './SchemaValidator'
import AppError from '../services/utility/AppError'
import { dbRead } from '../db/DbManager'

const { getFullErrorCode, setErrorCode } = require('@monsantoit/error-decorator')()

class BlockValidator extends SchemaValidator {
  constructor() {
    super()
    super.setFileCode('3I')
  }

  static get PATCH_VALIDATION_SCHEMA() {
    return [
      { paramName: 'id', type: 'numeric', required: true },
      { paramName: 'id', type: 'refData', entity: dbRead.block },
      { paramName: 'name', type: 'string', required: true },
    ]
  }

  getEntityName = () => 'Block'

  getBusinessKeyPropertyNames = () => ['name']

  @setErrorCode('3I1000')
  getSchema = (operationName) => {
    switch (operationName) {
      case 'PATCH':
        return BlockValidator.PATCH_VALIDATION_SCHEMA
      default:
        throw AppError.badRequest('Invalid Operation', undefined, getFullErrorCode('3I1001'))
    }
  }

  @setErrorCode('3I2000')
  preValidate = (blockObj) => {
    if (!_.isArray(blockObj) || blockObj.length === 0) {
      return Promise.reject(
        AppError.badRequest('Block request object needs to be an array', undefined, getFullErrorCode('3I2001')))
    }

    const blockNames = _.map(blockObj, 'name')

    if (_.uniq(blockNames).length !== blockNames.length) {
      return Promise.reject(
        AppError.badRequest('Block names must be unique', undefined, getFullErrorCode('3I2002')))
    }

    const blockIds = _.map(blockObj, 'id')

    if (_.uniq(blockIds).length !== blockIds.length) {
      return Promise.reject(
        AppError.badRequest('Block ids must be unique', undefined, getFullErrorCode('3I2003')))
    }
    return Promise.resolve()
  }
}

module.exports = BlockValidator
