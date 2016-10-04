/*
PUT, DELTE
 /experiment-designs
 */

module.exports = (rep) => {
    return {
        repository: () => {
            return rep
        },

        find: (id) => {
            return rep.oneOrNone("SELECT * FROM ref_experiment_design WHERE id = $1", id)
        },

        all: () => {
            return rep.any("SELECT * FROM ref_experiment_design")
        },

        create: (t, experimentDesignObj, created_user_id) => {
            return t.one("INSERT into ref_experiment_design(name, created_date, created_user_id) values('" + experimentDesignObj.name + "', CURRENT_TIMESTAMP,'" + created_user_id + "') RETURNING id", (id) => { return id })
        },

        update: (t, id, experimentDesignObj) => {
            return t.one("UPDATE ref_experiment_design SET name='" + experimentDesignObj.name + "' WHERE id=" + id + " RETURNING *", (expDesign) => { return expDesign})
        },

        "delete": (t, id) => {
            return t.one("DELETE from ref_experiment_design where id=" + id + " RETURNING id")
        }
    }
}

