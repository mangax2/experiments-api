module.exports = (rep, pgp) => {
    return {
        repository: () => {
            return rep
        },

        find: (id, tx = rep) => {
            return tx.oneOrNone("SELECT * FROM treatment WHERE id = $1", id)
        },

        batchFind: (ids, tx = rep) => {
            return tx.any("SELECT * FROM treatment WHERE id IN ($1:csv)", [ids])
        },

        findAllByExperimentId: (experimentId, tx = rep) => {
            return tx.any("SELECT * FROM treatment WHERE experiment_id=$1", experimentId)
        },

        batchCreate: (treatments, context, tx = rep) => {
            const columnSet = new pgp.helpers.ColumnSet(
                ['is_control', 'name', 'notes', 'experiment_id', 'created_user_id', 'created_date', 'modified_user_id', 'modified_date'],
                {table: 'treatment'}
            )
            const values = treatments.map((t) => {
                return{
                    is_control: t.isControl,
                    name: t.name,
                    notes: t.notes,
                    experiment_id: t.experimentId,
                    created_user_id: context.userId,
                    created_date: 'CURRENT_TIMESTAMP',
                    modified_user_id: context.userId,
                    modified_date: 'CURRENT_TIMESTAMP'
                }
            })
            const query = pgp.helpers.insert(values, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP') + ' RETURNING id'

            return tx.any(query)
        },

        batchUpdate: (treatments, context, tx = rep) => {
            const columnSet = new pgp.helpers.ColumnSet(
                ['?id', 'is_control', 'name', 'notes', 'experiment_id', 'modified_user_id', 'modified_date'],
                {table: 'treatment'}
            )
            const data = treatments.map((t) => {
                return {
                    id: t.id,
                    is_control: t.isControl,
                    name: t.name,
                    notes: t.notes,
                    experiment_id: t.experimentId,
                    modified_user_id: context.userId,
                    modified_date: 'CURRENT_TIMESTAMP'
                }
            })
            const query = pgp.helpers.update(data, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP') + ' WHERE v.id = t.id RETURNING *'

            return tx.any(query)
        },

        remove: (id, tx = rep) => {
            return tx.oneOrNone("DELETE FROM treatment WHERE id=$1 RETURNING id", id)
        },

        batchRemove: (ids, tx = rep) => {
            if (ids == null || ids == undefined || ids.length == 0) {
                return Promise.resolve([])
            } else {
                return tx.any("DELETE FROM treatment WHERE id IN ($1:csv) RETURNING id", [ids])
            }
        },

        removeByExperimentId: (experimentId, tx = rep) => {
            return tx.any("DELETE FROM treatment WHERE experiment_id = $1 RETURNING id", experimentId)
        },

        findByBusinessKey: (keys, tx = rep) => {
            return tx.oneOrNone("SELECT * FROM treatment WHERE experiment_id=$1 and name=$2", keys)
        },

        batchFindByBusinessKey: (batchKeys, tx= rep) => {
            return tx.any(
                pgp.helpers.concat(
                    batchKeys.map((obj)=>{
                           return {
                                query:"SELECT experiment_id,name FROM treatment WHERE experiment_id=$1 and name=$2 and id!=$3",
                                values: obj.keys.concat(obj.updateId)

                            }

                    }

                    )
                )
            )
        }


    }
}