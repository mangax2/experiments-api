import log4js from 'log4js'
import db from '../db/DbManager'
import AppError from './utility/AppError'

const logger = log4js.getLogger('RefDesignSpecService')

class RefDesignSpecificationService {
  getDesignSpecById = id => db.refDesignSpecification.find(id)
    .then((data) => {
      if (!data) {
        logger.error(`RefDesignSpec Not Found for requested id = ${id}`)
        throw AppError.notFound('RefDesignSpec Not Found for requested id')
      } else {
        return data
      }
    })

  getAllRefDesignSpecs = () => db.refDesignSpecification.all()
}

module.exports = RefDesignSpecificationService
