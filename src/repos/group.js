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
            return tx.batch(
                groups.map(
                    g => tx.one(
                        'INSERT INTO "group"(experiment_id, parent_id, ref_randomization_strategy_id, created_user_id, created_date, modified_user_id, modified_date) ' +
                        'VALUES($1, $2, $3, $4, CURRENT_TIMESTAMP, $4, CURRENT_TIMESTAMP) RETURNING id',
                        [g.experimentId, g.parentId, g.refRandomizationStrategyId, context.userId]
                    )
                )
            )
        },


        batchUpdate: (groups, context, tx = rep) => {
            return tx.batch(
                groups.map(
                    g => tx.oneOrNone(
                        'UPDATE "group" SET (experiment_id, parent_id, ref_randomization_strategy_id, modified_user_id, modified_date) = ' +
                        '($1, $2, $3, $4, CURRENT_TIMESTAMP) WHERE id = $5 RETURNING *',
                        [g.experimentId, g.parentId, g.refRandomizationStrategyId, context.userId, g.id]
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