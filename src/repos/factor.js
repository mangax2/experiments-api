import _, { every, isNull } from 'lodash'
const { setErrorCode } = require('@monsantoit/error-decorator')()

// Error Codes 57XXXX
class factorRepo {
  constructor(rep, pgp) {
    this.rep = rep
    this.pgp = pgp
  }

  @setErrorCode('570000')
  repository = () => this.rep

  @setErrorCode('572000')
  batchFind = (ids) => this.rep.any('SELECT * FROM factor WHERE id IN ($1:csv)', [ids]).then(data => {
    const keyedData = _.keyBy(data, 'id')
    return _.map(ids, id => keyedData[id])
  })

  @setErrorCode('57C000')
  batchFindAssociatedVariables = async ids => {
    const query = `select f.id, fl_parent.factor_id as associated_factor_id
    from factor f 
    join factor_level fl_this on f.id = fl_this.factor_id
    left join factor_level_association fla_1 on fla_1.nested_level_id = fl_this.id
    left join factor_level fl_parent on fl_parent.id = fla_1.associated_level_id
    where f.id IN ($1:csv)
    group by fl_parent.factor_id, f.id`

    const data = await this.rep.any(query, [ids])
    const keyed = data.reduce((acc, row) => ({
      ...acc,
      [row.id]: row.associated_factor_id
    }), {})

    return ids.map(id => keyed[id])
  }

  @setErrorCode('57D000')
  batchFindNestedVariables = async ids => {
    const query = `with grouped_children as (
      select f.id, fl_child.factor_id as nested_factor_id
      from factor f 
      join factor_level fl_this on f.id = fl_this.factor_id
      left join factor_level_association fla on fla.associated_level_id = fl_this.id
      left join factor_level fl_child on fl_child.id = fla.nested_level_id
      where f.id IN ($1:csv)
       group by fl_child.factor_id, f.id
      order by f.id, fl_child.factor_id
    ), non_null_set as (
      select * from grouped_children where nested_factor_id is not null
    ), dedupe_set as (
      select * from grouped_children g where g.id not in ( select id from non_null_set)
      union all
      select * from non_null_set
    ) select id, json_agg(nested_factor_id) as nested_variables from dedupe_set group by id`

    const data = await this.rep.any(query, [ids])
    const keyed = data.reduce((acc, mem) => ({
        ...acc,
        [mem.id]: every(mem.nested_variables, isNull) ? null : mem.nested_variables
      }), {})

    return ids.map(id => keyed[id])
  }

  @setErrorCode('573000')
  findByExperimentId = (experimentId) => this.rep.any(`
  WITH w as (select fl.factor_id as associated_factor_id
  
        from factor f
  
        join factor_level fl on f.id = fl.factor_id
  
        join factor_level_association fla on fla.nested_level_id = fl.id
  
        )
        select f.* ,w.associated_factor_id,
        (
          SELECT jsonb_agg(fl) as factorLevel
            FROM (select  fl.id as associatedTreatmentVariableId,fl.created_user_id ,associated_level_id,
                    (select jsonb_agg(factorLevelDetails) as factorLevelDetails from (
                        select 'questionCode',
      CASE WHEN fpl.multi_question_tag IS NOT NULL THEN
        fld.question_code
      ELSE
        fpl.question_code
      END,
      'rowNumber',
      row_number,
      'objectType',
      object_type,
      'label',
      label,
      'multiQuestionTag',
      multi_question_tag,
      'catalogType',
      material_type,
      'valueType',
      value_type,
      'text',
      text,
      'value',
      fld.value,
      'uomCode',
      uom_code from factor_properties_for_level fpl inner join factor_level_details fld on fpl.id= fld.factor_properties_for_level_id where factor_id=f.id)
                     as factorLevelDetails)
                    from factor_level fl LEFT JOIN factor_level_association fla on fla.nested_level_id=fl.id where factor_id = f.id) as fl
        )
      from factor f left join w on f.id=w.associated_factor_id where experiment_id=$1`, experimentId)

  @setErrorCode('574000')
  all = () => this.rep.any('SELECT * FROM factor')

  @setErrorCode('575000')
  batchCreate = (factors, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      [
        'name',
        'ref_factor_type_id',
        'experiment_id',
        'created_user_id',
        'created_date:raw',
        'modified_user_id',
        'modified_date:raw',
        'tier:raw',
        'is_blocking_factor_only',
      ],
      {table: 'factor'})
    const values = factors.map(factor => ({
      name: factor.name,
      ref_factor_type_id: factor.refFactorTypeId,
      experiment_id: factor.experimentId,
      created_user_id: context.userId,
      created_date: 'CURRENT_TIMESTAMP',
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
      tier: `CAST(${factor.tier === undefined ? null : factor.tier} AS numeric)`,
      is_blocking_factor_only: factor.isBlockingFactorOnly || false,
    }))
    const query = `${this.pgp.helpers.insert(values, columnSet)} RETURNING id`
    return tx.any(query)
  }

  @setErrorCode('576000')
  batchUpdate = (factors, context, tx = this.rep) => {
    const columnSet = new this.pgp.helpers.ColumnSet(
      [
        '?id',
        'name',
        'ref_factor_type_id',
        'experiment_id',
        'modified_user_id',
        'modified_date:raw',
        'tier:raw',
        'is_blocking_factor_only',
      ],
      {table: 'factor'})
    const data = factors.map(factor => ({
      id: factor.id,
      name: factor.name,
      ref_factor_type_id: factor.refFactorTypeId,
      experiment_id: factor.experimentId,
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
      tier: `CAST(${factor.tier === undefined ? null : factor.tier} AS numeric)`,
      is_blocking_factor_only: factor.isBlockingFactorOnly || false,
    }))
    const query = `${this.pgp.helpers.update(data, columnSet)} WHERE v.id = t.id RETURNING *`
    return tx.any(query)
  }

  @setErrorCode('577000')
  batchRemove = (ids, tx = this.rep) => {
    if (!ids || ids.length === 0) {
      return Promise.resolve([])
    }
    return tx.any('DELETE FROM factor WHERE id IN ($1:csv) RETURNING id', [ids])
  }

  @setErrorCode('578000')
  findByBusinessKey = (keys) => this.rep.oneOrNone('SELECT * FROM factor WHERE experiment_id=$1 and name=$2', keys)

  @setErrorCode('579000')
  batchFindByBusinessKey = (batchKeys) => {
    const values = batchKeys.map(obj => ({
      experiment_id: obj.keys[0],
      name: obj.keys[1],
      id: obj.updateId,
    }))
    const query = `WITH d(experiment_id, name, id) AS (VALUES ${this.pgp.helpers.values(values, ['experiment_id', 'name', 'id'])}) select entity.experiment_id, entity.name from public.factor entity inner join d on entity.experiment_id = CAST(d.experiment_id as integer) and entity.name = d.name and (d.id is null or entity.id != CAST(d.id as integer))`
    return this.rep.any(query)
  }

  @setErrorCode('57A000')
  batchFindByExperimentId = (experimentIds) => {
    return this.rep.any('SELECT * FROM factor WHERE experiment_id IN ($1:csv)', [experimentIds])
      .then(data => {
        const dataByExperimentId = _.groupBy(data, 'experiment_id')
        return _.map(experimentIds, experimentId => dataByExperimentId[experimentId] || [])
      })
  }

  @setErrorCode('57B000')
  removeTiersForExperiment = (experimentId, tx = this.rep) => {
    const query = 'UPDATE factor SET tier = NULL WHERE experiment_id = $1'
    return tx.none(query, experimentId)
  }
}

module.exports = (rep, pgp) => new factorRepo(rep, pgp)
