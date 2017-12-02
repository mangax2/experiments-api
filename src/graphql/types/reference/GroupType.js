import { GraphQLObjectType, GraphQLInt, GraphQLString } from 'graphql'
import GroupTypeService from '../../../services/GroupTypeService'

const GroupType = new GraphQLObjectType({
  name: 'GroupType',
  fields: {
    id: {
      type: GraphQLInt,
    },
    type: {
      type: GraphQLString,
    },
  },
})

const getGroupTypeById = ({ id }) =>
  new GroupTypeService().getGroupTypeById(id)

export { GroupType, getGroupTypeById }
