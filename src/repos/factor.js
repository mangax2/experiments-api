module.exports = (rep, pgp) => {
    return {
        repository: () => {
            return rep
        },

        find: (id, tx = rep) => {
            return tx.oneOrNone("SELECT * FROM factor WHERE id = $1", id)
        },

        batchFind: (ids, tx = rep) => {
            return tx.any("SELECT * FROM factor WHERE id IN ($1:csv)", [ids])
        },

        findByExperimentId: (experimentId, tx = rep) => {
            return tx.any("SELECT * FROM factor WHERE experiment_id=$1", experimentId)
        },

        all: (tx = rep) => {
            return tx.any("SELECT * FROM factor")
        },

        batchCreate: (factors, context, tx = rep) => {
            return tx.batch(
                factors.map(
                    factor => tx.one(
                        "INSERT INTO factor(name, ref_factor_type_id, experiment_id, created_user_id, created_date, modified_user_id, modified_date, tier) " +
                        "VALUES($1, $2, $3, $4, CURRENT_TIMESTAMP, $4, CURRENT_TIMESTAMP, $5) RETURNING id",
                        [factor.name, factor.refFactorTypeId, factor.experimentId, context.userId, factor.tier]
                    )
                )
            )
        },

        batchUpdate: (factors, context, tx = rep) => {
            return tx.batch(
                factors.map(
                    factor => tx.oneOrNone(
                        "UPDATE factor SET (name, ref_factor_type_id, experiment_id, modified_user_id, modified_date, tier) = " +
                        "($1, $2, $3, $4, CURRENT_TIMESTAMP, $6) WHERE id=$5 RETURNING *",
                        [factor.name, factor.refFactorTypeId, factor.experimentId, context.userId, factor.id, factor.tier]
                    )
                )
            )
        },

        remove: (id, tx = rep) => {
            return tx.oneOrNone("DELETE FROM factor WHERE id=$1 RETURNING id", id)
        },

        removeByExperimentId: (experimentId, tx = rep) => {
            return tx.any("DELETE FROM factor WHERE experiment_id = $1 RETURNING id", experimentId)
        },

        findByBusinessKey: (keys, tx = rep) => {
            return tx.oneOrNone("SELECT * FROM factor WHERE experiment_id=$1 and name=$2", keys)
        },

        batchFindByBusinessKey: (batchKeys, tx= rep) => {
            const values = batchKeys.map((obj) => {
                return {
                    experiment_id: obj.keys[0],
                    name: obj.keys[1],
                    id: obj.updateId
                }
            })
            const query = 'WITH d(experiment_id, name, id) AS (VALUES ' + pgp.helpers.values(values, ['experiment_id', 'name', 'id']) + ') select entity.experiment_id, entity.name from public.factor entity inner join d on entity.experiment_id = CAST(d.experiment_id as integer) and entity.name = d.name and (d.id is null or entity.id != CAST(d.id as integer))'
            return tx.any(query)
        }
    }
}