module.exports = (rep) => {
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

        batchCreate: (hypothesisObj) => {
            return rep.tx(t=>t.batch(hypothesisObj.map(l=>t.one(
                "insert into hypothesis(description, is_null, status, experiment_id, created_user_id, created_date," +
                " modified_user_id, modified_date) values($(description) , $(isNull) , $(status), $(experimentId), $(userId), CURRENT_TIMESTAMP, $(userId), CURRENT_TIMESTAMP)  RETURNING id", l)
            )))
        },

        update: (id, hypothesisObj) => {
            return rep.oneOrNone("UPDATE hypothesis SET (description, is_null, status, experiment_id," +
                "modified_user_id, modified_date) = ($(description) , $(isNull) , $(status), $(experimentId), $(userId), CURRENT_TIMESTAMP) WHERE id=" + id + " RETURNING *", hypothesisObj)
        },

        remove: (id) => {
            return rep.oneOrNone("delete from hypothesis where id=" + id + " RETURNING id")
        },

        getHypothesisByExperimentAndDescriptionAndType:(experimentId,description,isNull) => {
            return rep.oneOrNone("SELECT * FROM hypothesis where experiment_id = $1 and description = $2 and is_null = $3", [experimentId, description , isNull])
        },

        findByBusinessKey: (keys) => {
            return rep.oneOrNone("SELECT * FROM hypothesis where experiment_id = $1 and description = $2 and is_null = $3", keys)

        }
    }
}
