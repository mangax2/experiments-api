import _ from 'lodash'
import setErrorDecorator from '../decorators/setErrorDecorator'

const { setErrorCode } = setErrorDecorator()

// Error Codes 59XXXX
class factorLevelAssociationRepo {
  constructor(rep, pgp) {
    this.rep = rep
    this.pgp = pgp
  }

  @setErrorCode('590000')
  repository = () => this.rep

  @setErrorCode('591000')
  find = (id, tx = this.rep) => tx.oneOrNone('SELECT * FROM factor_level_association WHERE id = $1', id)

  @setErrorCode('592000')
  batchFind = (ids, tx = this.rep) => tx.any('SELECT * FROM factor_level_association WHERE id IN ($1:csv)', [ids])

  @setErrorCode('593000')
  findByExperimentId = (experimentId, tx = this.rep) => tx.any('SELECT fla.* FROM factor f INNER JOIN factor_level fl ON f.id = fl.factor_id INNER JOIN factor_level_association fla ON fl.id = fla.associated_level_id WHERE f.experiment_id = $1', experimentId)

  @setErrorCode('594000')
  batchCreate = (factorLevelAssociations, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      [
        'associated_level_id',
        'nested_level_id',
        'created_user_id',
        'created_date:raw',
        'modified_user_id',
        'modified_date:raw'
      ],
      {table: 'factor_level_association'})
    const values = _.map(factorLevelAssociations, factorLevelAssociation => ({
      associated_level_id: factorLevelAssociation.associatedLevelId,
      nested_level_id: factorLevelAssociation.nestedLevelId,
      created_user_id: context.userId,
      created_date: 'CURRENT_TIMESTAMP',
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP'
    }))
    const query = `${this.pgp.helpers.insert(values, columnSet)} RETURNING id`
    return tx.any(query)
  }

  @setErrorCode('595000')
  remove = (id, tx = this.rep) => tx.oneOrNone('DELETE FROM factor_level_association WHERE id=$1 RETURNING id', id)

  @setErrorCode('596000')
  batchRemove = (ids, tx = this.rep) => {
    if (!ids || ids.length === 0) {
      return Promise.resolve([])
    }
    return tx.any('DELETE FROM factor_level_association WHERE id IN ($1:csv) RETURNING id', [ids])
  }

  @setErrorCode('597000')
  removeByExperimentId = (experimentId, tx = this.rep) => tx.any('DELETE FROM factor_level_association flat WHERE flat.id IN (SELECT fla.id FROM factor f INNER JOIN factor_level fl ON f.id = fl.factor_id INNER JOIN factor_level_association fla ON fl.id = fla.associated_level_id WHERE f.experiment_id = $1) RETURNING id', experimentId)

  @setErrorCode('598000')
  findByBusinessKey = (keys, tx = this.rep) => tx.oneOrNone('SELECT * FROM factor_level_association WHERE associated_level_id=$1 and nested_level_id=$2', keys)

  @setErrorCode('599000')
  batchFindByBusinessKey = (batchKeys, tx = this.rep) => {
    const values = _.map(batchKeys, obj => ({
      associated_level_id: obj.keys[0],
      nested_level_id: obj.keys[1],
      id: obj.updateId,
    }))
    const query = `WITH d(associated_level_id, nested_level_id, id) \
    AS (VALUES ${this.pgp.helpers.values(values, ['associated_level_id', 'nested_level_id', 'id'])}) \
    select entity.associated_level_id, entity.nested_level_id \
    from public.factor_level_association entity \
    inner join d on entity.associated_level_id = CAST(d.associated_level_id as integer) \
    and entity.nested_level_id = d.nested_level_id \
    and (d.id is null or entity.id != CAST(d.id as integer))`
    return tx.any(query)
  }

  @setErrorCode('59A000')
  findNestedLevels = (associatedLevelId, tx = this.rep) => tx.any('SELECT fl.* FROM factor_level fl INNER JOIN factor_level_association fla ON fl.id = fla.nested_level_id WHERE fla.associated_level_id=$1', associatedLevelId)

  @setErrorCode('59B000')
  batchFindNestedLevels = (associatedLevelIds, tx = this.rep) => {
    return tx.any('SELECT fla.associated_level_id, fl.* FROM factor_level fl INNER JOIN factor_level_association fla ON fl.id = fla.nested_level_id WHERE fla.associated_level_id IN ($1:csv)', [associatedLevelIds])
      .then(data => _.map(associatedLevelIds, associatedLevelId => _.map(_.filter(data, row => row.associated_level_id === associatedLevelId), row => _.omit(row, ['associated_level_id']))))
  }

  @setErrorCode('59C000')
  findAssociatedLevels = (nestedLevelId, tx = this.rep) => tx.any('SELECT fl.* FROM factor_level fl INNER JOIN factor_level_association fla ON fl.id = fla.associated_level_id WHERE fla.nested_level_id=$1', nestedLevelId)

  @setErrorCode('59D000')
  batchFindAssociatedLevels = (nestedLevelIds, tx = this.rep) => {
    return tx.any('SELECT fla.nested_level_id, fl.* FROM factor_level fl INNER JOIN factor_level_association fla ON fl.id = fla.associated_level_id WHERE fla.nested_level_id IN ($1:csv)', [nestedLevelIds])
      .then(data => _.map(nestedLevelIds, nestedLevelId => _.map(_.filter(data, row => row.nested_level_id === nestedLevelId), row => _.omit(row, ['nested_level_id']))))
  }
}

module.exports = (rep, pgp) => new factorLevelAssociationRepo(rep, pgp)