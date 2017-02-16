import _ from 'lodash'

module.exports = (rep, pgp) => {
    return {
        repository: () => {
            return rep
        },

        find: (id, tx = rep) => {
            return tx.oneOrNone("SELECT * FROM group_value WHERE id = $1", id)
        },

        batchFind: (ids, tx = rep) => {
            return tx.any("SELECT * FROM group_value WHERE id IN ($1:csv)", [ids])
        },

        findAllByGroupId: (groupId, tx = rep) => {
            return tx.any("SELECT * FROM group_value WHERE group_id = $1", groupId)
        },

        batchFindAllByGroupIds: (groupIds, tx = rep) => {
            if (groupIds == null || groupIds == undefined || groupIds.length == 0) {
                return Promise.resolve([])
            } else {
                return tx.any("SELECT * FROM group_value WHERE group_id IN ($1:csv)", [groupIds]).then((data) => {
                    const groupValues = _.groupBy(data, (d) => d.group_id)
                    return _.map(groupIds, (groupId) => groupValues[groupId])
                })
            }
        },

        batchCreate: (groupValues, context, tx = rep) => {
            const columnSet = new pgp.helpers.ColumnSet(
                ['name','value','group_id','created_user_id','created_date','modified_user_id','modified_date'],
                {table: 'group_value'}
            )

            const values = groupValues.map((gv) => {
                return{
                    name: gv.name,
                    value: gv.value,
                    group_id: gv.groupId,
                    created_user_id: context.userId,
                    created_date: 'CURRENT_TIMESTAMP',
                    modified_user_id: context.userId,
                    modified_date: 'CURRENT_TIMESTAMP',
                }
            })
            const query = pgp.helpers.insert(values, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP') + ' RETURNING id'

            return tx.any(query)
        },

        batchUpdate: (groupValues, context, tx = rep) => {
            const columnSet = new pgp.helpers.ColumnSet(
                ['?id', 'name', 'value', 'group_id', 'modified_user_id', 'modified_date'],
                {table: 'group_value'}
            )

            const data = groupValues.map((gv) => {
                return {
                    id: gv.id,
                    name: gv.name,
                    value: gv.value,
                    group_id: gv.groupId,
                    modified_user_id: context.userId,
                    modified_date: 'CURRENT_TIMESTAMP',
                }
            })
            const query = pgp.helpers.update(data, columnSet).replace(/'CURRENT_TIMESTAMP'/g, 'CURRENT_TIMESTAMP') + ' WHERE v.id = t.id RETURNING *'

            return tx.any(query)
        },

        remove: (id, tx= rep) => {
            return tx.oneOrNone("DELETE FROM group_value WHERE id = $1 RETURNING id", id)
        },

        batchRemove: (ids, tx = rep) => {
            if (ids == null || ids == undefined || ids.length == 0) {
                return Promise.resolve([])
            } else {
                return tx.any("DELETE FROM group_value WHERE id IN ($1:csv) RETURNING id", [ids])
            }
        },

        findByBusinessKey: (keys, tx= rep) => {
            return tx.oneOrNone("SELECT * FROM group_value WHERE group_id = $1 and name = $2", keys)
        },

        batchFindByBusinessKey: (batchKeys, tx= rep) => {
            const values = batchKeys.map((obj) => {
                return {
                    name: obj.keys[1],
                    group_id: obj.keys[0],
                    id: obj.updateId
                }
            })
            const query = 'WITH d(group_id, name, id) AS (VALUES ' + pgp.helpers.values(values, ['group_id', 'name', 'id']) + ') select gv.group_id, gv.name from public.group_value gv inner join d on gv.group_id = CAST(d.group_id as integer) and gv.name = d.name and (d.id is null or gv.id != CAST(d.id as integer))'
            return tx.any(query)
        }
    }
}