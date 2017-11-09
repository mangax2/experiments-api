import _ from "lodash"

module.exports = (rep, pgp) => ({
    repository: () => rep,

    find: (id, tx = rep) => tx.oneOrNone('SELECT * FROM factor_level_association WHERE id = $1', id),

    batchFind: (ids, tx = rep) => tx.any('SELECT * FROM factor_level_association WHERE id IN ($1:csv)', [ids]),

    findByExperimentId: (experimentId, tx = rep) => tx.any('SELECT fla.* ' +
        'FROM factor f ' +
        'INNER JOIN factor_level fl ON f.id = fl.factor_id ' +
        'INNER JOIN factor_level_association fla ON fl.id = fla.associated_level_id ' +
        'WHERE f.experiment_id = $1', experimentId),


    batchCreate: (factorLevelAssociations, context, tx = rep) => {
        const columnSet = new pgp.helpers.ColumnSet(
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
        const query = `${pgp.helpers.insert(values, columnSet)} RETURNING id`
        return tx.any(query)
    },

    remove: (id, tx = rep) => tx.oneOrNone('DELETE FROM factor_level_association WHERE id=$1 RETURNING id', id),

    batchRemove: (ids, tx = rep) => {
        if (!ids || ids.length === 0) {
            return Promise.resolve([])
        }
        return tx.any('DELETE FROM factor_level_association WHERE id IN ($1:csv) RETURNING id', [ids])
    },

    removeByExperimentId: (experimentId, tx = rep) => tx.any('DELETE FROM factor_level_association flat ' +
        'WHERE flat.id IN ( ' +
        '  SELECT fla.id ' +
        '  FROM factor f ' +
        '  INNER JOIN factor_level fl ON f.id = fl.factor_id ' +
        '  INNER JOIN factor_level_association fla ON fl.id = fla.associated_level_id ' +
        '  WHERE f.experiment_id = $1 ' +
        ') RETURNING id', experimentId),

    findByBusinessKey: (keys, tx = rep) => tx.oneOrNone('SELECT * FROM factor_level_association WHERE associated_level_id=$1 and nested_level_id=$2', keys),

    batchFindByBusinessKey: (batchKeys, tx = rep) => {
        const values = _.map(batchKeys, obj => ({
            associated_level_id: obj.keys[0],
            nested_level_id: obj.keys[1],
            id: obj.updateId,
        }))
        const query = `WITH d(associated_level_id, nested_level_id, id) \
        AS (VALUES ${pgp.helpers.values(values, ['associated_level_id', 'nested_level_id', 'id'])}) \
        select entity.associated_level_id, entity.nested_level_id \
        from public.factor_level_association entity \
        inner join d on entity.associated_level_id = CAST(d.associated_level_id as integer) \
        and entity.nested_level_id = d.nested_level_id \
        and (d.id is null or entity.id != CAST(d.id as integer))`
        return tx.any(query)
    },
})