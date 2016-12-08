//FOR PARTIAL UPDATE SUPPORT:
//
// import * as _ from 'lodash'
// import pgp from 'pg-promise'
//
// function columnMap(key){
//     switch(key.toLowerCase()){
//         case 'subjecttype':
//             return 'subject_type'
//         case 'refexperimentdesignid':
//             return 'ref_experiment_design_id'
//         default:
//             return key.toLowerCase()
//     }
// }
//
// function updateQuery(table, values, id, userId){
//     const keys = Object.keys(values)
//     return pgp.as.format(`UPDATE $1~ SET ($2^,modified_date,modified_user_id) = ($3^,CURRENT_TIMESTAMP, '${userId}') WHERE id=${id} RETURNING *`, [
//         table,
//         keys.map(k => pgp.as.name(columnMap(k))).join(', '),
//         keys.map(k => '${' + k + '}').join(', ')
//     ])
// }

module.exports = (rep, pgp) => {
    return {
        repository: () => {
            return rep
        },

        find: (id, tx = rep) => {
            return tx.oneOrNone("SELECT * FROM experiment WHERE id = $1", id)
        },

        batchFind: (ids, tx = rep) => {
            return tx.any("SELECT * FROM experiment WHERE id IN ($1:csv)", [ids])
        },

        all: () => {
            return rep.any("SELECT * FROM experiment")
        },

        batchCreate: (experiments, context, tx = rep) => {
            return tx.batch(
                experiments.map(
                    experiment => tx.one(
                        "insert into experiment(name, subject_type, ref_experiment_design_id, status,created_user_id, created_date," +
                        "modified_user_id, modified_date) values($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $5, CURRENT_TIMESTAMP)  RETURNING id",
                        [experiment.name, experiment.subjectType, experiment.refExperimentDesignId, experiment.status, context.userId]
                    )
                )
            )
        },

        update: (id, experimentObj, context) => {
            return rep.oneOrNone("UPDATE experiment SET (name, subject_type, ref_experiment_design_id,status,"+
                "modified_user_id, modified_date) = ($1,$2,$3,$4,$5,CURRENT_TIMESTAMP) WHERE id=$6 RETURNING *",[experimentObj.name,experimentObj.subjectType, experimentObj.refExperimentDesignId, experimentObj.status, context.userId, id])
        },

        //FOR PARTIAL UPDATE SUPPORT:
        //
        // update: (id, experimentObj, context) => {
        //     const experimentId = experimentObj.experimentId
        //     const data = _.omit(experimentObj, ['experimentId'])
        //
        //     if(_.keys(data).length == 0){
        //         return Promise.reject("No Data Provided To Update")
        //     }
        //
        //     const query = updateQuery('experiment', data, id, context.userId)
        //     return rep.oneOrNone(query, data)
        // },

        remove: (id) => {
            return rep.oneOrNone("delete from experiment where id=$1 RETURNING id", id)
        }
    }
}
