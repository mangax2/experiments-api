/*eslint quotes: ["warn", "double"]*/

module.exports = (rep) => {
    return {
        repository: () => {
            return rep
        },

        find: (id) => {
            return rep.oneOrNone("SELECT * FROM ref_experiment_design WHERE id=$1", id)
        },

        all: () => {
            return rep.any("SELECT * FROM ref_experiment_design")
        },

        create: (t, experimentDesignObj, created_user_id) => {
            return t.one("INSERT INTO ref_experiment_design(name, created_date, created_user_id, modified_user_id, modified_date) VALUES($1, CURRENT_TIMESTAMP, $2, $3, CURRENT_TIMESTAMP) RETURNING id", [experimentDesignObj.name, created_user_id, created_user_id], (id) => { return id })
        },

        update: (t, id, experimentDesignObj, modified_user_id) => {
            return t.one("UPDATE ref_experiment_design SET (name, modified_user_id, modified_date) = ($1, $2, CURRENT_TIMESTAMP) WHERE id=$3 RETURNING *", [experimentDesignObj.name, modified_user_id, id], (expDesign) => { return expDesign})
        },

        "delete": (t, id) => {
            return t.one("DELETE FROM ref_experiment_design WHERE id=$1 RETURNING id", id)
        }
    }
}

