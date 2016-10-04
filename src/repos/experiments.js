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
            console.log (experimentObj)
            return t.one("insert into experiment(name, subject_type, reps, ref_experiment_design_id, created_date," +
                " created_user_id, modified_date, modified_user_id, status) values('" + experimentObj.name + "' , '" + experimentObj.subjectType + "' , '" + Number(experimentObj.reps) + "' , '" + experimentObj.ref_experiment_design_id + "' , CURRENT_TIMESTAMP , '"+ experimentObj.userId + "' , CURRENT_TIMESTAMP , '"+ experimentObj.userId + "' , '" + experimentObj.status + "' ) RETURNING id", (id) => { return id })
        },

        update: (t, id, experimentObj) => {
            return t.one("UPDATE experiment SET name='" + experimentObj.name + "', status='" + experimentObj.status + "' WHERE id=" + id + " RETURNING *", (exp) => { return exp})
        },

        "delete": (t, id) => {
            return t.one("delete from experiment where id=" + id + " RETURNING id")
        }
    }
}
