module.exports = (rep, pgp) => {
    return {
        repository: () => {
            return rep
        },

        find: (id) => {
            return rep.oneOrNone("SELECT * FROM ref_experiment_design WHERE id=$1", id)
        },
        batchFind: (ids, tx = rep) => {
            return tx.any("SELECT * FROM ref_experiment_design WHERE id IN ($1:csv)", [ids])
        },

        all: () => {
            return rep.any("SELECT * FROM ref_experiment_design")
        },

        create: (t, experimentDesignObj, context) => {
            return t.one("INSERT INTO ref_experiment_design(name, created_user_id, created_date, modified_user_id, modified_date) VALUES($1, $2,CURRENT_TIMESTAMP, $2, CURRENT_TIMESTAMP) RETURNING id", [experimentDesignObj.name, context.userId])
        },

        update: (id, experimentDesignObj, context) => {
            return rep.oneOrNone("UPDATE ref_experiment_design SET (name, modified_user_id, modified_date) = ($1, $2, CURRENT_TIMESTAMP) WHERE id=$3 RETURNING *", [experimentDesignObj.name, context.userId, id])
        },

        "delete": (id) => {
            return rep.oneOrNone("DELETE FROM ref_experiment_design WHERE id=$1 RETURNING id", id)
        },

        findByBusinessKey: (keys) => {
            return rep.oneOrNone("SELECT * FROM ref_experiment_design where name = $1", keys)

        },

        batchFindByBusinessKey: (batchKeys, tx= rep) => {
            const values = batchKeys.map((obj) => {
                return {
                    name: obj.keys[0],
                    id: obj.updateId
                }
            })
            const query = 'WITH d(name, id) AS (VALUES ' + pgp.helpers.values(values, ['name', 'id']) + ') select entity.name from public.ref_experiment_design entity inner join d on entity.name = d.name and (d.id is null or entity.id != CAST(d.id as integer))'
            return tx.any(query)
        }
    }
}

