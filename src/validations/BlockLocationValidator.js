import Joi from 'joi'
import get from 'lodash/get'
import AppError from '../services/utility/AppError'

const blockLocationPostInputSchema = Joi.array().items(
  Joi.object({
    blockId: Joi.number().greater(0).required(),
    location: Joi.number().greater(0).required(),
    units: Joi.array().items(
      Joi.object({
        treatmentId: Joi.number().greater(0).required(),
        rep: Joi.number().greater(0).required(),
      }),
    ),
  }),
)

export const validateBlockLocationSaveInput = async (body) => {
  try {
    await blockLocationPostInputSchema.validateAsync(body, { allowUnknown: true })
  } catch (error) {
    throw AppError.badRequest(get(error, 'details[0].message', 'blockLocation input schema error'))
  }
}

export default undefined
