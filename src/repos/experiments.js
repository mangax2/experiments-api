module.exports = (rep) => {
    return {
        repository: () => {
            return rep
        },

        find: (id, tx = rep) => {
            return tx.oneOrNone("SELECT * FROM experiment WHERE id = $1", id)
        },

        all: () => {
            return rep.any("SELECT * FROM experiment")
        },

        create: (t, experimentObj) => {
            return t.one("insert into experiment(name, subject_type, ref_experiment_design_id, status,created_user_id, created_date," +
                "modified_user_id, modified_date) values($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $5, CURRENT_TIMESTAMP)  RETURNING id",[experimentObj.name, experimentObj.subjectType, experimentObj.refExperimentDesignId, experimentObj.status, experimentObj.userId])
        },

        update: (id, experimentObj) => {
            return rep.oneOrNone("UPDATE experiment SET (name, subject_type, ref_experiment_design_id,status,"+
                "modified_user_id, modified_date) = ($1,$2,$3,$4,$5,CURRENT_TIMESTAMP) WHERE id="+id+" RETURNING *",[experimentObj.name,experimentObj.subjectType, experimentObj.refExperimentDesignId, experimentObj.status, experimentObj.userId])
        },

        remove: (id) => {
            return rep.oneOrNone("delete from experiment where id=" + id + " RETURNING id")
        }
    }
}
