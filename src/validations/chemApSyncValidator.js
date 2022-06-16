import get from 'lodash/get'
import Joi from 'joi'
import AppError from '../services/utility/AppError'

const chemApSyncInputSchema = Joi.object({
  experimentId: Joi.number().greater(0).required(),
})

export const chemApSyncInputSchemaValidate = async (body) => {
  try {
    await chemApSyncInputSchema.validateAsync(body)
  } catch (error) {
    throw AppError.badRequest(get(error, 'details[0].message', 'chemAP-sync input schema error'))
  }
}

export default chemApSyncInputSchemaValidate
