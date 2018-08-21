import _ from 'lodash'
import setErrorDecorator from '../decorators/setErrorDecorator'

const { setErrorCode } = setErrorDecorator()

// Error Codes 5BXXXX
class groupRepo {
  constructor(rep, pgp) {
    this.rep = rep
    this.pgp = pgp
  }

  @setErrorCode('5B0000')
  repository = () => this.rep

  @setErrorCode('5B1000')
  find = (id, tx = this.rep) => tx.oneOrNone('SELECT g.*, dsd.value::int AS ref_randomization_strategy_id FROM "group" g LEFT OUTER JOIN design_spec_detail dsd ON g.experiment_id = dsd.experiment_id AND dsd.ref_design_spec_id = 9 WHERE g.id = $1', id)

  @setErrorCode('5BA000')
  findGroupBySetId = (setId, tx = this.rep) => tx.oneOrNone('SELECT dsd.value::int AS ref_randomization_strategy_id, g.*, gv.value AS location_number FROM "group" g LEFT OUTER JOIN design_spec_detail dsd ON g.experiment_id = dsd.experiment_id AND dsd.ref_design_spec_id = 9 INNER JOIN group_value gv ON g.id = gv.group_id WHERE g.set_id = $1 AND gv.name = \'locationNumber\'', setId)

  @setErrorCode('5B2000')
  findRepGroupsBySetId = (setId, tx = this.rep) => tx.any('select dsd.value::int AS ref_randomization_strategy_id, g.*, gv.value as rep from (select g1.* from "group" g1, "group" g2 where g1.parent_id = g2.id and g2.set_id = $1) g LEFT OUTER JOIN design_spec_detail dsd ON g.experiment_id = dsd.experiment_id AND dsd.ref_design_spec_id = 9 inner join group_value gv on gv.group_id = g.id and gv.name = \'repNumber\' ',setId)

  @setErrorCode('5B3000')
  batchFind = (ids, tx = this.rep) => tx.any('SELECT dsd.value::int AS ref_randomization_strategy_id, g.* FROM "group" g LEFT OUTER JOIN design_spec_detail dsd ON g.experiment_id = dsd.experiment_id AND dsd.ref_design_spec_id = 9 WHERE g.id IN ($1:csv)', [ids]).then(data => {
    const keyedData = _.keyBy(data, 'id')
    return _.map(ids, id => keyedData[id])
  })

  @setErrorCode('5B4000')
  findAllByExperimentId = (experimentId, tx = this.rep) => tx.any('SELECT g.id, g.experiment_id, parent_id, dsd.value::int AS ref_randomization_strategy_id, ref_group_type_id, set_id  FROM "group" g LEFT OUTER JOIN design_spec_detail dsd ON g.experiment_id = dsd.experiment_id AND dsd.ref_design_spec_id = 9 WHERE g.experiment_id=$1 ORDER BY g.id ASC', experimentId)

  @setErrorCode('5B5000')
  batchCreate = (groups, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      ['experiment_id', 'parent_id', 'ref_group_type_id', 'created_user_id', 'created_date', 'modified_user_id', 'modified_date'],
      { table: 'group' },
    )

    const values = groups.map(group => ({
      experiment_id: group.experimentId,
      parent_id: group.parentId,
      ref_group_type_id: group.refGroupTypeId,
      created_user_id: context.userId,
      created_date: 'CURRENT_TIMESTAMP',
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))

    const query = `${this.pgp.helpers.insert(values, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} RETURNING id`

    return tx.any(query)
  }

  @setErrorCode('5B6000')
  batchUpdate = (groups, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      ['?id', 'experiment_id', {
        name: 'parent_id',
        cast: 'int',
      }, 'ref_group_type_id', 'modified_user_id', 'modified_date'],
      { table: 'group' },
    )
    const data = groups.map(u => ({
      id: u.id,
      experiment_id: u.experimentId,
      parent_id: u.parentId,
      ref_group_type_id: u.refGroupTypeId,
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))
    const query = `${this.pgp.helpers.update(data, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} WHERE v.id = t.id RETURNING *`

    return tx.any(query)
  }

  @setErrorCode('5B7000')
  partiallyUpdate = (groups, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      ['?id', 'set_id', 'modified_user_id', 'modified_date'],
      { table: 'group' },
    )
    const data = groups.map(group => ({
      id: group.id,
      set_id: group.setId,
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))
    const query = `${this.pgp.helpers.update(data, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} WHERE v.id = t.id RETURNING *`

    return tx.any(query)
  }

  @setErrorCode('5B8000')
  batchRemove = (ids, tx = this.rep) => {
    if (!ids || ids.length === 0) {
      return Promise.resolve([])
    }
    return tx.any('DELETE FROM "group" WHERE id IN ($1:csv) RETURNING id', [ids])
  }

  @setErrorCode('5B9000')
  removeByExperimentId = (experimentId, tx = this.rep) =>
    // Delete only top most groups DELETE CASCADE on parent_id will delete all child groups.
    tx.any('DELETE FROM "group" WHERE experiment_id = $1 and parent_id IS NULL RETURNING id', experimentId)

  @setErrorCode('5BA000')
  batchFindBySetId = (setId, tx = this.rep) => tx.one('SELECT g.*, dsd.value::int AS ref_randomization_strategy_id FROM "group" g LEFT OUTER JOIN design_spec_detail dsd ON g.experiment_id = dsd.experiment_id AND dsd.ref_design_spec_id = 9 WHERE set_id = $1', setId)

  @setErrorCode('5BB000')
  batchFindAllBySetIds = (setIds, tx = this.rep) => tx.any('SELECT g.*, dsd.value::int AS ref_randomization_strategy_id FROM "group" g LEFT OUTER JOIN design_spec_detail dsd ON g.experiment_id = dsd.experiment_id AND dsd.ref_design_spec_id = 9 WHERE set_id IN ($1:csv)', [setIds]).then(data => {
    const keyedData = _.keyBy(data, 'set_id')
    return _.map(setIds, setId => keyedData[setId])
  })

  @setErrorCode('5BC000')
  batchFindAllByExperimentId = (experimentIds, tx = this.rep) => {
    return tx.any('SELECT g.id, g.experiment_id, g.parent_id, dsd.value::int AS ref_randomization_strategy_id, g.ref_group_type_id, g.set_id, gt.id as group_type_id, gt.type, gv.id as group_value_id, gv.name, gv.value, gv.factor_level_id, gv.group_id, gv.created_user_id, gv.created_date, gv.modified_user_id, gv.modified_date FROM "group" g INNER JOIN ref_group_type gt on g.ref_group_type_id = gt.id LEFT JOIN group_value gv on g.id = gv.group_id LEFT OUTER JOIN design_spec_detail dsd ON g.experiment_id = dsd.experiment_id AND dsd.ref_design_spec_id = 9 WHERE g.experiment_id IN ($1:csv)', [experimentIds])
      .then(data => {
        const dataByGroup = _.groupBy(data, 'id')
        const groups = _.flatMap(_.values(dataByGroup), groupData => {
          const head = _.head(groupData)
          const currentGroup = {
            id: head.id,
            experiment_id: head.experiment_id,
            parent_id: head.parent_id,
            ref_randomization_strategy_id: head.ref_randomization_strategy_id,
            ref_group_type_id: head.ref_group_type_id,
            set_id: head.set_id,
            groupType: {
              id: head.group_type_id,
              type: head.type,
            }
          }
          currentGroup.groupValues = _.compact(_.map(groupData, groupValue => {
            if (!_.isNil(groupValue.group_value_id)) {
              return {
                id: groupValue.group_value_id,
                name: groupValue.name,
                value: groupValue.value,
                factor_level_id: groupValue.factor_level_id,
                group_id: groupValue.group_id,
                created_user_id: groupValue.created_user_id,
                created_date: groupValue.created_date,
                modified_user_id: groupValue.modified_user_id,
                modified_date: groupValue.modified_date,
              }
            } else {
              return null
            }
          }))
          return currentGroup
        })
        const dataByExperimentId = _.groupBy(groups, 'experiment_id')
        return _.map(experimentIds, experimentId => dataByExperimentId[experimentId] || [])
      })
  }

  @setErrorCode('5BD000')
  findAllByParentId = (parentId, tx = this.rep) => tx.any('SELECT dsd.value::int AS ref_randomization_strategy_id, g.* FROM "group" g LEFT OUTER JOIN design_spec_detail dsd ON g.experiment_id = dsd.experiment_id AND dsd.ref_design_spec_id = 9 WHERE parent_id=$1', parentId)

  @setErrorCode('5BE000')
  batchFindAllByParentId = (parentIds, tx = this.rep) => {
    return tx.any('SELECT dsd.value::int AS ref_randomization_strategy_id, g.* FROM "group" g LEFT OUTER JOIN design_spec_detail dsd ON g.experiment_id = dsd.experiment_id AND dsd.ref_design_spec_id = 9 WHERE parent_id in ($1:csv)', [parentIds])
      .then(data => {
        const dataByParentId = _.groupBy(data, 'parent_id')
        return _.map(parentIds, parentId => dataByParentId[parentId] || [])
      })
  }

  @setErrorCode('5BF000')
  clearSetId = (setId, tx = this.rep) => {
    return tx.any('UPDATE "group" SET set_id = NULL WHERE set_id=$1 RETURNING experiment_id', setId)
  }

  @setErrorCode('5BG000')
  getLocSetIdAssociation = (experimentId, tx = this.rep) =>
    tx.any('SELECT g.experiment_id, g.id as group_id, g.set_id, gv.value as location FROM public.group g INNER JOIN group_value gv ON g.id = gv.group_id WHERE set_id IS NOT NULL AND gv.name=\'locationNumber\' AND g.experiment_id=$1', experimentId)
}

module.exports = (rep, pgp) => new groupRepo(rep, pgp)
