/* eslint-disable prefer-destructuring,import/no-extraneous-dependencies */

verifySchema()

function verifySchema() {
  require('babel-register')
  const validateSchema = require('graphql').validateSchema
  const schema = require('../schema').default
  const schemaErrors = validateSchema(schema)

  if (schemaErrors.length > 0) {
    throw new Error(`GraphQL Schema Is Invalid: ${schemaErrors.toString()}`)
  }
}
