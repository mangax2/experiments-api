import graphqlHTTP from 'express-graphql'
import db from '../db/DbManager'
import loaders from '../graphql/loaders'
import schema from '../graphql/schema'

function x(request, response) {
  return db.tx('GraphQLTransaction', (tx) => {
    const handler = graphqlHTTP({
      schema,
      context: { loaders: loaders.createLoaders(tx) },
      graphiql: true,
    })
    return handler(request, response)
  })
}

module.exports = x
