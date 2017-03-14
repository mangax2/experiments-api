module.exports = (rep, pgp) => {
    return {
        repository: () => {
            return rep
        },

        find: (id, tx = rep) => {
            return tx.oneOrNone("SELECT * FROM tag WHERE id = $1", id)
        },
        batchFind: (ids, tx = rep) => {
            return tx.any("SELECT * FROM tag WHERE id IN ($1:csv)", [ids])
        },

        all: () => {
            return rep.any("SELECT * FROM tag")
        },

        findByExperimentId: (experimentId) => {
            return rep.any("SELECT * FROM tag where experiment_id=$1", experimentId)
        },

        batchCreate: (tags, context, t = rep) => {
            const columnSet = new pgp.helpers.ColumnSet(
                ['name', 'value', 'experiment_id', 'created_user_id', 'created_date', 'modified_user_id', 'modified_date'],
                {table: 'tag'}
            )
            const values = tags.map((t) => {
                return {
                    name: t.name,
                    value: t.value,
                    experiment_id: t.experimentId,
                    created_user_id: context.userId,
                    created_date: 'CURRENT_TIMESTAMP',
                    modified_user_id: context.userId,
                    modified_date: 'CURRENT_TIMESTAMP'
                }
            })
            const query = pgp.helpers.insert(values, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP') + ' RETURNING id'

            return t.any(query)
        },
        batchRemove: (ids, tx = rep) => {
            if (ids == null || ids == undefined || ids.length == 0) {
                return Promise.resolve([])
            } else {
                return tx.any("DELETE FROM treatment WHERE id IN ($1:csv) RETURNING id", [ids])
            }
        },
        batchUpdate: (tags, context, tx = rep) => {
            const columnSet = new pgp.helpers.ColumnSet(
                ['?id', 'name', 'value', 'experiment_id', 'modified_user_id', 'modified_date'],
                {table: 'tag'}
            )
            const data = tags.map((t) => {
                return {
                    id: t.id,
                    value: t.value,
                    name: t.name,
                    experiment_id: t.experimentId,
                    modified_user_id: context.userId,
                    modified_date: 'CURRENT_TIMESTAMP'
                }
            })
            const query = pgp.helpers.update(data, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP') + ' WHERE v.id = t.id RETURNING *'

            return tx.any(query)
        },
        remove: (id) => {
            return rep.oneOrNone("delete from tag where id=$1 RETURNING id", id)
        },
        removeByExperimentId: (tx, experimentId) => {
            return tx.any("DELETE FROM tag where experiment_id=$1 RETURNING id", experimentId)
        },

        findByBusinessKey: (keys, tx = rep) => {
            return tx.oneOrNone("SELECT * FROM tag where experiment_id=$1 and name= $2", keys)
        },

        batchFindByBusinessKey: (batchKeys, tx = rep) => {
            const values = batchKeys.map((obj) => {
                return {
                    name: obj.keys[0],
                    value: obj.keys[1],
                    experiment_id: obj.keys[2],
                    id: obj.updateId
                }
            })
            const query = 'WITH d(name,value,experiment_id,id) AS (VALUES ' + pgp.helpers.values(values, ['name', 'value', 'experiment_id', 'id']) + ') select entity.name,entity.value,entity.experiment_id from public.tag entity inner join d on entity.experiment_id = CAST(d.experiment_id as integer) and entity.name = d.name and entity.value=d.value and (d.id is null or entity.id != CAST(d.id as integer))'
            return tx.any(query)
        }
    }
}
