import graphqlHTTP from 'express-graphql'
import { GraphQLError } from 'graphql'
import loaders from './loaders'
import config from '../../config'
import AuditManager from './GraphQLAuditManager'

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

const mutuallyExclusiveFields = (parentNode, ...exclusiveFields) => context => ({
  Field(node) {
    if (node.name.value === parentNode) {
      let matches = 0

      // eslint-disable-next-line no-restricted-syntax
      for (const { name: { value } } of node.selectionSet.selections) {
        matches += exclusiveFields.includes(value) ? 1 : 0

        if (matches > 1) {
          context.reportError(new GraphQLError(
            `Validation: Under ${parentNode}: ${exclusiveFields.join(', ')} are mutually exclusive.`,
          ))
          break
        }
      }
    }
  },
})

function formatDate(args, date) {
  return args.format === 'YYYYMM' ? new Date(date).toISOString().slice(0, 7) : date
}

function graphqlMiddlewareFunction(schema) {
  return function (request, response) {
    AuditManager.logRequest(request.body, request.context.userId, request.context.clientId)

    const handler = graphqlHTTP({
      schema,
      context: {
        loaders: loaders.createLoaders(),
        getAuditInfo: entity => ({
          createdDate: args => formatDate(args, entity.created_date),
          createdUserId: entity.created_user_id,
          modifiedDate: entity.modified_date,
          modifiedUserId: entity.modified_user_id,
        }),
      },
      // NOTE: Depth must be greater than schema depth or
      // GraphiQL will fail to retrieve documentation.
      validationRules: [
        LimitQueryDepth(15),
        LimitNumQueries(5),
        mutuallyExclusiveFields('treatmentVariableLevels', 'valueJSON', 'treatmentVariableLevelDetails', 'treatmentVariableLevelFlatDetails'),
      ],
      graphiql: config.env === 'local',
    })
    return handler(request, response)
  }
}

module.exports = graphqlMiddlewareFunction
