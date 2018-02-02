import { GraphQLObjectType, GraphQLString } from 'graphql'

const AuditInfo = new GraphQLObjectType({
  name: 'AuditInfo',
  fields: {
    // properties
    createdUserId: {
      type: GraphQLString,
    },
    modifiedUserId: {
      type: GraphQLString,
    },
    createdDate: {
      type: GraphQLString,
    },
    modifiedDate: {
      type: GraphQLString,
    },
  },
})

const getAuditInfo = ({
  created_user_id, modified_user_id, created_date, modified_date,
}) => ({
  createdUserId: created_user_id,
  modifiedUserId: modified_user_id,
  createdDate: created_date,
  modifiedDate: modified_date,
})

export { AuditInfo, getAuditInfo }
