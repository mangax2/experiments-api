/* eslint-disable prefer-destructuring,import/no-extraneous-dependencies,no-underscore-dangle */
const _ = require('lodash')

function getHierarchyRecursive(name, type, types, seenNames) {
  const recursiveFields = [name]
  const seenArray = seenNames.slice()

  const schemaType = _.find(types, t => t.name === type)

  _.forEach(schemaType.fields, (field) => {
    if (!seenArray.includes(field.name)) {
      if (field.type === undefined) {
        recursiveFields.push(field.name)
      } else {
        seenArray.push(field.name)
        recursiveFields.push(getHierarchyRecursive(field.name, field.type, types, seenArray))
      }
    }
  })

  return recursiveFields
}

function resolveHeirarchyString(fields, isRoot) {
  let graphqlString = ''
  const trimmedFields = isRoot ? fields.slice(1) : fields

  if (isRoot) {
    graphqlString += fields[0]
  }

  graphqlString += '{ '

  _.forEach(trimmedFields, (field) => {
    if (field instanceof Array) {
      graphqlString += `${resolveHeirarchyString(field, true)} `
    } else {
      graphqlString += `${field} `
    }
  })

  graphqlString += ' }'

  return graphqlString
}

function getSchemaHierarchy(entity) {
  require('babel-register')
  const importSchema = require('graphql-import').importSchema
  const buildSchema = require('graphql').buildSchema
  const introspectionFromSchema = require('graphql').introspectionFromSchema
  const badRequest = require('../../services/utility/AppError').badRequest

  const types = introspectionFromSchema(buildSchema(importSchema('./src/graphql/schema.graphql'))).__schema.types
  const filteredTypes = _.filter(types, x => x.kind === 'OBJECT' && x.name !== 'Query' && x.name !== 'Mutation' && x.name !== 'AuditInfo' && !x.name.includes('_'))
  const slimmedTypes = _.map(filteredTypes, (type) => {
    const slimTop = _.pick(type, ['kind', 'name', 'fields'])
    const slimmedFields = _.compact(_.map(slimTop.fields, (field) => {
      if (field.name === 'auditInfo' || field.name === 'value' || field.name === 'clusterComposite') {
        return undefined
      }

      const slimField = {
        name: field.name,
      }

      if (field.type.kind === 'OBJECT' || (field.type.ofType && field.type.ofType.kind === 'OBJECT')) {
        slimField.type = _.get(field, 'type.ofType.name') || _.get(field, 'type.name')
      }

      return slimField
    }))

    return {
      name: slimTop.name,
      fields: slimmedFields,
    }
  })

  const requestedEntity =
    _.find(slimmedTypes, type => type.name.toLowerCase() === entity.toLowerCase())

  if (requestedEntity) {
    const fields = []
    _.forEach(requestedEntity.fields, (field) => {
      if (field.type === undefined) {
        fields.push(field.name)
      } else {
        const seenArray = []
        fields.push(getHierarchyRecursive(field.name, field.type, slimmedTypes, seenArray))
      }
    })

    return resolveHeirarchyString(fields, false)
  }

  throw badRequest(`Requested entity: ${entity} does not exist as a type`)
}

module.exports = getSchemaHierarchy
