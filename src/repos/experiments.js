/*eslint quotes: ["warn", "double"]*/

//removed pgp from function arguments
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
            return t.one("insert into experiment(name, subject_type, reps, ref_experiment_design_id, created_date," +
                " created_user_id, modified_date, modified_user_id, status) values($1 , $2 , $3, $4, CURRENT_TIMESTAMP, $5, CURRENT_TIMESTAMP, $6,  $7)  RETURNING id",[experimentObj.name, experimentObj.subjectType ,Number(experimentObj.reps), experimentObj.ref_experiment_design_id,experimentObj.userId,experimentObj.userId, experimentObj.status], (id) => { return id })
        },

        update: (id, experimentObj) => {
            return rep.oneOrNone("UPDATE experiment SET (name, subject_type, reps, ref_experiment_design_id, created_date," +
                " created_user_id, modified_date, modified_user_id, status) = ($(name),$(subjectType),$(reps),$(refExperimentDesignId),CURRENT_TIMESTAMP,$(createdUserId),CURRENT_TIMESTAMP,$(modifiedUserId),$(status)) WHERE id="+id+" RETURNING *",experimentObj,(exp) =>{
                    return exp
            })
        },

        remove: (id) => {
            return rep.oneOrNone("delete from experiment where id=" + id + " RETURNING id")
        }
    }
}
