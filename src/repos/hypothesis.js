/**
 * Created by kprat1 on 12/10/16.
 */
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

        create: (hypothesisObj) => {
            return rep.one("insert into hypothesis(description, is_null, status, experiment_id, created_date," +
                " created_user_id) values($(description) , $(isNull) , $(status), $(experimentId), CURRENT_TIMESTAMP, $(userId))  RETURNING id", hypothesisObj)
        },
        batchCreate: (hypothesisObj) => {

            return rep.tx(t=>t.batch(hypothesisObj.map(l=>t.one(
                "insert into hypothesis(description, is_null, status, experiment_id, created_date," +
                " created_user_id) values($(description) , $(isNull) , $(status), $(experimentId), CURRENT_TIMESTAMP, $(userId))  RETURNING id", l)
            )))
        },

        update: (id, hypothesisObj) => {
            return rep.oneOrNone("UPDATE hypothesis SET (description, is_null, status, experiment_id," +
                "modified_date, modified_user_id) = ($(description) , $(isNull) , $(status), $(experimentId), CURRENT_TIMESTAMP, $(userId)) WHERE id=" + id + " RETURNING *", hypothesisObj)
        },

        remove: (id) => {
            return rep.oneOrNone("delete from hypothesis where id=" + id + " RETURNING id")
        },
        getHypothesisByExperimentAndDescriptionAndType:(experimentId,description,isNull) => {
            return rep.oneOrNone("SELECT * FROM hypothesis where experiment_id = $1 and description = $2 and is_null = $3", [experimentId, description , isNull])
        }
    }
}
