/* eslint-disable prefer-destructuring,import/no-extraneous-dependencies */

verifySchema()

function verifySchema() {
  require('babel-register')
  const importSchema = require('graphql-import').importSchema
  const buildSchema = require('graphql').buildSchema

  const validateSchema = require('graphql').validateSchema
  const schema = buildSchema(importSchema('./src/graphql/schema.graphql'))
  const schemaErrors = validateSchema(schema)

  if (schemaErrors.length > 0) {
    throw new Error(`GraphQL Schema Is Invalid: ${schemaErrors.toString()}`)
  }
}
