module.exports = (rep, pgp) => {
    return {
        repository: () => {
            return rep
        },

        find: (id) => {
            return rep.oneOrNone("SELECT * FROM hypothesis WHERE id = $1", id)
        },

        all: () => {
            return rep.any("SELECT * FROM hypothesis")
        },

        findByExperimentId: (experimentId) => {
            return rep.any("SELECT * FROM hypothesis where experiment_id=$1", experimentId)
        },

        batchCreate: (hypothesisObj, context) => {
            return rep.tx(t=>t.batch(hypothesisObj.map(h=>
                    t.one(
                        "insert into hypothesis(description, is_null, status, experiment_id, created_user_id, created_date," +
                        " modified_user_id, modified_date) values($1 , $2 , $3, $4, $5, CURRENT_TIMESTAMP, $5, CURRENT_TIMESTAMP)  RETURNING id", [h.description, h.isNull, h.status, h.experimentId, context.userId])

            )))
        },

        update: (id, hypothesisObj, context) => {
            return rep.oneOrNone("UPDATE hypothesis SET (description, is_null, status, experiment_id," +
                "modified_user_id, modified_date) = ($1 , $2 , $3, $4, $5, CURRENT_TIMESTAMP) WHERE id=" + id + " RETURNING *", [hypothesisObj.description, hypothesisObj.isNull, hypothesisObj.status, hypothesisObj.experimentId, context.userId])
        },

        remove: (id) => {
            return rep.oneOrNone("delete from hypothesis where id=" + id + " RETURNING id")
        },

        getHypothesisByExperimentAndDescriptionAndType:(experimentId,description,isNull) => {
            return rep.oneOrNone("SELECT * FROM hypothesis where experiment_id = $1 and description = $2 and is_null = $3", [experimentId, description , isNull])
        },

        findByBusinessKey: (keys) => {
            return rep.oneOrNone("SELECT * FROM hypothesis where experiment_id = $1 and description = $2 and is_null = $3", keys)
        },

        batchFindByBusinessKey: (batchKeys, tx= rep) => {
            const values = batchKeys.map((obj) => {
                return {
                    experiment_id: obj.keys[0],
                    description: obj.keys[1],
                    is_null: obj.keys[2],
                    id: obj.updateId
                }
            })
            const query = 'WITH d(experiment_id, description, is_null, id) AS (VALUES ' + pgp.helpers.values(values, ['experiment_id', 'description', 'is_null', 'id']) + ') select entity.experiment_id, entity.description, entity.is_null from public.hypothesis entity inner join d on entity.experiment_id = CAST(d.experiment_id as integer) and entity.description = d.description and entity.is_null = d.is_null and (d.id is null or entity.id != CAST(d.id as integer))'
            return tx.any(query)
        }
    }
}
