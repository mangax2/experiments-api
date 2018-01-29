import log4js from 'log4js'
import db from '../db/DbManager'
import AppError from './utility/AppError'
import setErrorDecorator from '../decorators/setErrorDecorator'

const { getFullErrorCode, setErrorCode } = setErrorDecorator()

const logger = log4js.getLogger('RefDesignSpecService')

// Error Codes 1MXXXX
class RefDesignSpecificationService {
  @setErrorCode('1M1000')
  getDesignSpecById = (id, context) => db.refDesignSpecification.find(id)
    .then((data) => {
      if (!data) {
        logger.error(`[[${context.requestId}]] RefDesignSpec Not Found for requested id = ${id}`)
        throw AppError.notFound('RefDesignSpec Not Found for requested id', undefined, getFullErrorCode('1M1001'))
      } else {
        return data
      }
    })

  @setErrorCode('1M2000')
  getAllRefDesignSpecs = () => db.refDesignSpecification.all()
}

module.exports = RefDesignSpecificationService
