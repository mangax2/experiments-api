module.exports = (rep) => {
    return {
        repository: () => {
            return rep
        },

        find: (id) => {
            return rep.oneOrNone("SELECT * FROM experiment WHERE id = $1", id)
        },

        all: () => {
            return rep.any("SELECT * FROM experiment")
        },

        create: (t, experimentObj) => {
            return t.one("insert into experiment(name, subject_type, ref_experiment_design_id, created_date," +
                " created_user_id, status) values($1, $2, $3, CURRENT_TIMESTAMP, $4,  $5)  RETURNING id",[experimentObj.name, experimentObj.subjectType, experimentObj.refExperimentDesignId, experimentObj.userId, experimentObj.status])
        },

        update: (id, experimentObj) => {
            return rep.oneOrNone("UPDATE experiment SET (name, subject_type, ref_experiment_design_id,"+
                "modified_date, modified_user_id, status) = ($1,$2,$3,CURRENT_TIMESTAMP,$4,$5) WHERE id="+id+" RETURNING *",[experimentObj.name,experimentObj.subjectType, experimentObj.refExperimentDesignId, experimentObj.userId, experimentObj.status])
        },

        remove: (id) => {
            return rep.oneOrNone("delete from experiment where id=" + id + " RETURNING id")
        }
    }
}
