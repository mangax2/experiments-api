import graphqlHTTP from 'express-graphql'
import { GraphQLError } from 'graphql'
import db from '../db/DbManager'
import loaders from '../graphql/loaders'
import schema from '../graphql/schema'

function LimitQueryDepth(maxDepth) {
  return (context) => {
    let currentDepth = 0
    return {
      Field: {
        enter: () => {
          currentDepth += 1
          if (currentDepth > maxDepth) {
            context.reportError(new GraphQLError(
              `Validation: Query has exceeded maximum allowed depth of ${maxDepth}`))
          }
        },
        leave: () => {
          currentDepth -= 1
        },
      },
    }
  }
}

function x(request, response) {
  return db.tx('GraphQLTransaction', (tx) => {
    const handler = graphqlHTTP({
      schema,
      context: { loaders: loaders.createLoaders(tx) },
      // NOTE: Depth must be greater than schema depth or
      // GraphiQL will fail to retrieve documentation.
      validationRules: [LimitQueryDepth(10)],
      graphiql: true,
    })
    return handler(request, response)
  })
}

module.exports = x
