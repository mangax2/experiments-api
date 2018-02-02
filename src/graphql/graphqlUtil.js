/* eslint-disable prefer-destructuring */

writeSchema()

function writeSchema() {
  const schema = require('./schema').default
  const printSchema = require('graphql').printSchema

  const graphQLSchema = printSchema(schema)
  const trimmedSchema = graphQLSchema.replace(/"""(.|\n)*"""/g, '')

  const fs = require('fs')
  const stream = fs.createWriteStream('./schema.graphql')
  stream.once('open', () => {
    stream.write(trimmedSchema)
    stream.end()
  })
}
