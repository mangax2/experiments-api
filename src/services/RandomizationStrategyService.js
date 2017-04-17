import log4js from 'log4js'
import db from '../db/DbManager'
import AppError from './utility/AppError'

const logger = log4js.getLogger('RandomizationStrategyService')

class RandomizationStrategyService {

  getRandomizationStrategyById = id => db.randomizationStrategy.find(id)
    .then((data) => {
      if (!data) {
        logger.error(`Randomization Strategy Not Found for requested id = ${id}`)
        throw AppError.notFound('Randomization Strategy Not Found for requested id')
      } else {
        return data
      }
    })

  getAllRandomizationStrategies = () => db.randomizationStrategy.all()
}

module.exports = RandomizationStrategyService
