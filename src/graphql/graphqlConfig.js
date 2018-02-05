import graphqlHTTP from 'express-graphql'
import { GraphQLError } from 'graphql'
import db from '../db/DbManager'
import loaders from '../graphql/loaders'
import config from '../../config'

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

function LimitNumQueries(maxQueries) {
  return (context) => {
    let currentNumQueries = 0
    return {
      Field: {
        enter: () => {
          if (context.getParentType()) {
            if (context.getParentType().toString() === 'Query') {
              currentNumQueries += 1

              if (currentNumQueries > maxQueries) {
                context.reportError(new GraphQLError(
                  `Validation: Number of queries per request has exceeded maximum allowed number: ${maxQueries}`))
              }
            }
          }
        },
      },
    }
  }
}

function graphqlMiddlewareFunction(schema) {
  return function (request, response) {
    return db.tx('GraphQLTransaction', (tx) => {
      const handler = graphqlHTTP({
        schema,
        context: {
          loaders: loaders.createLoaders(tx),
          getAuditInfo: entity => ({
            createdDate: entity.created_date,
            createdUserId: entity.created_user_id,
            modifiedDate: entity.modified_date,
            modifiedUserId: entity.modified_user_id,
          }),
        },
        // NOTE: Depth must be greater than schema depth or
        // GraphiQL will fail to retrieve documentation.
        validationRules: [LimitQueryDepth(10), LimitNumQueries(5)],
        graphiql: config.env === 'local',
      })
      return handler(request, response)
    })
  }
}

module.exports = graphqlMiddlewareFunction
