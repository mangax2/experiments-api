import graphqlHTTP from 'express-graphql'
import { GraphQLError } from 'graphql'
import db from '../db/DbManager'
import loaders from './loaders'
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

function LogQuery(request, context, logger) {
  if (context.clientId) {
    db.graphqlAudit.batchCreate([{ raw: request }], context).catch((err) => {
      logger.warn(`Unable to persist GraphQL query to database. Reason: ${err.message}. Original query: ${JSON.stringify(request)}`)
    })
  }
}

function formatDate(args, date) {
  return args.format === 'YYYYMM' ? new Date(date).toISOString().slice(0, 7) : date
}

function graphqlMiddlewareFunction(schema) {
  return function (request, response) {
    console.info(JSON.stringify(request.body))

    return db.tx('GraphQLTransaction', (tx) => {
      const handler = graphqlHTTP({
        schema,
        context: {
          loaders: loaders.createLoaders(tx),
          getAuditInfo: entity => ({
            createdDate: args => formatDate(args, entity.created_date),
            createdUserId: entity.created_user_id,
            modifiedDate: entity.modified_date,
            modifiedUserId: entity.modified_user_id,
          }),
        },
        // NOTE: Depth must be greater than schema depth or
        // GraphiQL will fail to retrieve documentation.
        validationRules: [LimitQueryDepth(15), LimitNumQueries(5)],
        graphiql: config.env === 'local',
      })
      LogQuery(request.body, request.context, console)
      return handler(request, response)
    })
  }
}

module.exports = graphqlMiddlewareFunction
