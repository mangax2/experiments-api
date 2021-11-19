import Joi from 'joi'
import { get } from 'lodash'
import { badRequest } from '../services/utility/AppError'

const setEntryPatchBody = Joi.array().items(
  Joi.object({
    existingSetEntryId: Joi.number().greater(0).required(),
    incomingSetEntryId: Joi.number().greater(0).required(),
  }),
).min(1)

const validate = async (body) => {
  try {
    return await setEntryPatchBody.validateAsync(body)
  } catch (error) {
    throw badRequest(get(error, 'details[0].message', 'set entry validation error'))
  }
}

export default validate
