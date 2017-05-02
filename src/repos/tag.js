module.exports = (rep, pgp) => ({
  repository: () => rep,

  find: (id, tx = rep) => tx.oneOrNone('SELECT * FROM tag WHERE id = $1', id),

  batchFind: (ids, tx = rep) => tx.any('SELECT * FROM tag WHERE id IN ($1:csv)', [ids]),

  all: () => rep.any('SELECT * FROM tag'),

  findByExperimentId: experimentId => rep.any('SELECT * FROM tag where experiment_id=$1', experimentId),

  batchFindByExperimentIds: (experimentIds, tx = rep) => tx.any('SELECT * FROM tag where experiment_id IN ($1:csv)', [experimentIds]),

  batchCreate: (tags, context, t = rep) => {
    const columnSet = new pgp.helpers.ColumnSet(
      ['name', 'value', 'experiment_id', 'created_user_id', 'created_date', 'modified_user_id', 'modified_date'],
      { table: 'tag' },
    )
    const values = tags.map(tag => ({
      name: tag.name,
      value: tag.value,
      experiment_id: tag.experimentId,
      created_user_id: context.userId,
      created_date: 'CURRENT_TIMESTAMP',
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))
    const query = `${pgp.helpers.insert(values, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} RETURNING id`

    return t.any(query)
  },
  batchRemove: (ids, tx = rep) => {
    if (!ids || ids.length === 0) {
      return Promise.resolve([])
    }
    return tx.any('DELETE FROM tag WHERE id IN ($1:csv) RETURNING id', [ids])
  },
  batchUpdate: (tags, context, tx = rep) => {
    const columnSet = new pgp.helpers.ColumnSet(
      ['?id', 'name', 'value', 'experiment_id', 'modified_user_id', 'modified_date'],
      { table: 'tag' },
    )
    const data = tags.map(t => ({
      id: t.id,
      value: t.value,
      name: t.name,
      experiment_id: t.experimentId,
      modified_user_id: context.userId,
      modified_date: 'CURRENT_TIMESTAMP',
    }))
    const query = `${pgp.helpers.update(data, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP')} WHERE v.id = t.id RETURNING *`

    return tx.any(query)
  },
  remove: id => rep.oneOrNone('delete from tag where id=$1 RETURNING id', id),
  removeByExperimentId: (experimentId, tx) => tx.any('DELETE FROM tag where experiment_id=$1 RETURNING id', experimentId),

  searchByTagName: queryStr => rep.any('SELECT DISTINCT(name) FROM tag where LOWER(name) like $1', `%${queryStr.toLowerCase()}%`),

  searchByTagValueForATagName: (tagName, queryStr) => rep.any('SELECT DISTINCT(value) FROM' +
    ' TAG  WHERE LOWER(name) = $1 AND LOWER(value) LIKE $2', [tagName.toLowerCase(),
      `%${queryStr.toLowerCase()}%`]),

  findByBusinessKey: (keys, tx = rep) => tx.oneOrNone('SELECT * FROM tag where experiment_id=$1 and name= $2', keys),

  batchFindByBusinessKey: (batchKeys, tx = rep) => {
    const values = batchKeys.map(obj => ({
      name: obj.keys[0],
      value: obj.keys[1],
      experiment_id: obj.keys[2],
      id: obj.updateId,
    }))
    const query = `WITH d(name,value,experiment_id,id) AS (VALUES ${pgp.helpers.values(values, ['name', 'value', 'experiment_id', 'id'])}) select entity.name,entity.value,entity.experiment_id from public.tag entity inner join d on entity.experiment_id = CAST(d.experiment_id as integer) and entity.name = d.name and entity.value=d.value and (d.id is null or entity.id != CAST(d.id as integer))`
    return tx.any(query)
  },
})
