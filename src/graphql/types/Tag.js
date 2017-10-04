import { GraphQLObjectType, GraphQLString } from 'graphql'
import TagService from '../../services/TagService'

const Tag = new GraphQLObjectType({
  name: 'Tag',
  fields: {
    category: {
      type: GraphQLString,
    },
    value: {
      type: GraphQLString,
    },
  },
})

const getTagsByExperimentId = ({ id, isTemplate = false }) =>
  new TagService().getTagsByExperimentId(id, isTemplate)

export { Tag, getTagsByExperimentId }
