module.exports = (rep) => {
    return {
        repository: () => {
            return rep
        },

        find: (id) => {
            return rep.oneOrNone("SELECT * FROM ref_factor_type WHERE id = $1", id)
        },

        all: () => {
            return rep.any("SELECT * FROM ref_factor_type")
        },

        create: (t, factorTypeObj, created_user_id) => {
            return t.one("INSERT into ref_factor_type(type, created_user_id, created_date, modified_user_id, modified_date) values($1, $2, CURRENT_TIMESTAMP, $2, CURRENT_TIMESTAMP) RETURNING id", [factorTypeObj.type, created_user_id])
        },

        update: (t, id, factorTypeObj, modified_user_id) => {
            return t.oneOrNone("UPDATE ref_factor_type SET type=$1, modified_user_id=$2, modified_date=CURRENT_TIMESTAMP WHERE id=$3 RETURNING *", [factorTypeObj.type, modified_user_id, id])
        },

        "delete": (t, id) => {
            return t.oneOrNone("DELETE from ref_factor_type where id=$1 RETURNING id", id)
        }
    }
}