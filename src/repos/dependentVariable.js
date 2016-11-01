module.exports = (rep) => {
    return {
        repository: () => {
            return rep
        },

        find: (id) => {
            return rep.oneOrNone("SELECT * FROM dependent_variable WHERE id = $1", id)
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
                "modified_user_id, modified_date) = ($1,$2,$3,$4,CURRENT_TIMESTAMP) WHERE id="+dependentVariable.id+" RETURNING *",[dependentVariable.required, dependentVariable.name, dependentVariable.experimentId, context.userId])
            ))
        },

        remove: (id) => {
            return rep.oneOrNone("delete from dependent_variable where id=" + id + " RETURNING id")
        },

        findByBusinessKey: (keys) => {
            return rep.oneOrNone("SELECT * FROM dependent_variable where experiment_id=$1 and name= $2", keys)

        }
    }
}
