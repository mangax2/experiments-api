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
  find = (id, tx = this.rep) => tx.oneOrNone('SELECT * FROM "group" WHERE id = $1', id)

  @setErrorCode('5BA000')
  findGroupBySetId = (setId, tx = this.rep) => tx.oneOrNone('SELECT g.*, gv.value AS location_number FROM "group" g INNER JOIN group_value gv ON g.id = gv.group_id WHERE g.set_id = $1 AND gv.name = \'locationNumber\'', setId)

  @setErrorCode('5B2000')
  findRepGroupsBySetId = (setId, tx = this.rep) => tx.any('select g.*, gv.value as rep from (select g1.* from "group" g1, "group" g2 where g1.parent_id = g2.id and g2.set_id = $1) g inner join group_value gv on gv.group_id = g.id and gv.name = \'repNumber\' ',setId)

  @setErrorCode('5B3000')
  batchFind = (ids, tx = this.rep) => tx.any('SELECT * FROM "group" WHERE id IN ($1:csv)', [ids])

  @setErrorCode('5B4000')
  findAllByExperimentId = (experimentId, tx = this.rep) => tx.any('SELECT id, experiment_id, parent_id, ref_randomization_strategy_id, ref_group_type_id, set_id  FROM "group" WHERE experiment_id=$1 ORDER BY id ASC', experimentId)

  @setErrorCode('5B5000')
  batchCreate = (groups, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      ['experiment_id', 'parent_id', 'ref_randomization_strategy_id', 'ref_group_type_id', 'created_user_id', 'created_date', 'modified_user_id', 'modified_date'],
      { table: 'group' },
    )

    const values = groups.map(group => ({
      experiment_id: group.experimentId,
      parent_id: group.parentId,
      ref_randomization_strategy_id: group.refRandomizationStrategyId,
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
      }, {
        name: 'ref_randomization_strategy_id',
        cast: 'int',
      }, 'ref_group_type_id', 'modified_user_id', 'modified_date'],
      { table: 'group' },
    )
    const data = groups.map(u => ({
      id: u.id,
      experiment_id: u.experimentId,
      parent_id: u.parentId,
      ref_randomization_strategy_id: u.refRandomizationStrategyId,
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
}

module.exports = (rep, pgp) => new groupRepo(rep, pgp)
