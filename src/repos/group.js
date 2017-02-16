module.exports = (rep, pgp) => {
    return {
        repository: () => {
            return rep
        },

        find: (id, tx = rep) => {
            return tx.oneOrNone('SELECT * FROM "group" WHERE id = $1', id)
        },

        batchFind: (ids, tx = rep) => {
            return tx.any('SELECT * FROM "group" WHERE id IN ($1:csv)', [ids])
        },

        findAllByExperimentId: (experimentId, tx = rep) => {
            return tx.any('SELECT * FROM "group" WHERE experiment_id=$1 ORDER BY id ASC', experimentId)
        },

        batchCreate: (groups, context, tx = rep) => {
            const columnSet = new pgp.helpers.ColumnSet(
                ['experiment_id', 'parent_id', 'ref_randomization_strategy_id', 'ref_group_type_id', 'created_user_id', 'created_date', 'modified_user_id', 'modified_date'],
                {table: 'group'}
            )

            const values = groups.map((group)=>{
                return {
                    experiment_id: group.experimentId,
                    parent_id: group.parentId,
                    ref_randomization_strategy_id: group.refRandomizationStrategyId,
                    ref_group_type_id: group.refGroupTypeId,
                    created_user_id: context.userId,
                    created_date: 'CURRENT_TIMESTAMP',
                    modified_user_id: context.userId,
                    modified_date: 'CURRENT_TIMESTAMP'
                }
            })

            const query = pgp.helpers.insert(values, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP') + ' RETURNING id'

            return tx.any(query)
        },


        batchUpdate: (groups, context, tx = rep) => {
            return tx.batch(
                groups.map(
                    g => tx.oneOrNone(
                        'UPDATE "group" SET (experiment_id, parent_id, ref_randomization_strategy_id, ref_group_type_id, modified_user_id, modified_date) = ' +
                        '($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) WHERE id = $6 RETURNING *',
                        [g.experimentId, g.parentId, g.refRandomizationStrategyId, g.refGroupTypeId, context.userId, g.id]
                    )
                )
            )
        },

        remove: (id, tx = rep) => {
            return tx.oneOrNone('DELETE FROM "group" WHERE id=$1 RETURNING id', id)
        },

        batchRemove: (ids, tx = rep) => {
            if (ids == null || ids == undefined || ids.length == 0) {
                return Promise.resolve([])
            } else {
                return tx.any('DELETE FROM "group" WHERE id IN ($1:csv) RETURNING id', [ids])
            }
        },

        removeByExperimentId: (experimentId, tx = rep) => {
            return tx.any('DELETE FROM "group" WHERE experiment_id = $1 RETURNING id', experimentId)
        }

    }
}