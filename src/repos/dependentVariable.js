module.exports = (rep, pgp) => {
    return {
        repository: () => {
            return rep
        },

        find: (id, tx = rep) => {
            return tx.oneOrNone("SELECT * FROM dependent_variable WHERE id = $1", id)
        },
        batchFind: (ids, tx = rep) => {
            return tx.any("SELECT * FROM dependent_variable WHERE id IN ($1:csv)", [ids])
        },

        all: () => {
            return rep.any("SELECT * FROM dependent_variable")
        },

        findByExperimentId: (experimentId) => {
            return rep.any("SELECT * FROM dependent_variable where experiment_id=$1", experimentId)
        },

        batchCreate: (t, dependentVariables, context) => {
            return t.batch(dependentVariables.map(dependentVariable=>t.one("insert into dependent_variable(required, name, experiment_id, created_user_id, created_date," +
                "modified_user_id, modified_date) values($1, $2, $3, $4, CURRENT_TIMESTAMP, $4, CURRENT_TIMESTAMP)  RETURNING id",[dependentVariable.required, dependentVariable.name, dependentVariable.experimentId, context.userId])
            ))
        },

        batchUpdate: (t, dependentVariables, context) => {
            return t.batch(dependentVariables.map(dependentVariable=>t.oneOrNone("UPDATE dependent_variable SET (required, name, experiment_id,"+
                "modified_user_id, modified_date) = ($1,$2,$3,$4,CURRENT_TIMESTAMP) WHERE id=$5 RETURNING *",[dependentVariable.required, dependentVariable.name, dependentVariable.experimentId, context.userId, dependentVariable.id])
            ))
        },

        remove: (id) => {
            return rep.oneOrNone("delete from dependent_variable where id=$1 RETURNING id", id)
        },

        removeByExperimentId: (tx, experimentId) => {
            return tx.any("DELETE FROM dependent_variable where experiment_id=$1 RETURNING id", experimentId)
        },

        findByBusinessKey: (keys, tx = rep) => {
            return tx.oneOrNone("SELECT * FROM dependent_variable where experiment_id=$1 and name= $2", keys)
        },

        batchFindByBusinessKey: (batchKeys, tx= rep) => {
            const values = batchKeys.map((obj) => {
                return {
                    experiment_id: obj.keys[0],
                    name: obj.keys[1],
                    id: obj.updateId
                }
            })
            const query = 'WITH d(experiment_id, name, id) AS (VALUES ' + pgp.helpers.values(values, ['experiment_id', 'name', 'id']) + ') select entity.experiment_id, entity.name from public.dependent_variable entity inner join d on entity.experiment_id = CAST(d.experiment_id as integer) and entity.name = d.name and (d.id is null or entity.id != CAST(d.id as integer))'
            return tx.any(query)
        }
    }
}
