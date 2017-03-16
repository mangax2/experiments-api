module.exports = (rep, pgp) => {
    return {
        repository: () => {
            return rep
        },

        find: (id, tx = rep) => {
            return tx.oneOrNone("SELECT * FROM experiment WHERE id = $1", id)
        },

        batchFind: (ids, tx = rep) => {
            return tx.any("SELECT * FROM experiment WHERE id IN ($1:csv)", [ids])
        },

        all: () => {
            return rep.any("SELECT * FROM experiment")
        },

        batchCreate: (experiments, context, tx = rep) => {
            return tx.batch(
                experiments.map(
                    experiment => tx.one(
                        "insert into experiment(name, description, ref_experiment_design_id, status,created_user_id, created_date," +
                        "modified_user_id, modified_date) values($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $5, CURRENT_TIMESTAMP)  RETURNING id",
                        [experiment.name, experiment.description, experiment.refExperimentDesignId, experiment.status, context.userId]
                    )
                )
            )
        },

        update: (id, experimentObj, context, tx = rep) => {
            return tx.oneOrNone("UPDATE experiment SET (name, description, ref_experiment_design_id,status,"+
                "modified_user_id, modified_date) = ($1,$2,$3,$4,$5,CURRENT_TIMESTAMP) WHERE id=$6 RETURNING *",[experimentObj.name,experimentObj.description, experimentObj.refExperimentDesignId, experimentObj.status, context.userId,id])
        },

        remove: (id) => {
            return rep.oneOrNone("delete from experiment where id=$1 RETURNING id", id)
        }
    }
}
