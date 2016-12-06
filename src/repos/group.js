module.exports = (rep, pgp) => {
    return {
        repository: () => {
            return rep
        },

        find: (id, tx = rep) => {
            return tx.oneOrNone('SELECT * FROM "group" WHERE id = $1', id)
        },

        findByExperimentId: (experimentId, tx = rep) => {
            return tx.any('SELECT * FROM "group" WHERE experiment_id=$1', experimentId)
        },

        batchFind: (ids, tx = rep) => {
            return tx.any('SELECT * FROM "group" WHERE id IN ($1:csv)', [ids])
        }

    }
}