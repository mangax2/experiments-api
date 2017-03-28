module.exports = (rep, pgp) => {
    return {
        repository: () => {
            return rep
        },

        find: (id) => {
            return rep.oneOrNone("SELECT * FROM ref_data_source WHERE id = $1", id)
        },

        findByTypeId: (id) => {
            return rep.any("SELECT * FROM ref_data_source WHERE ref_data_source_type_id = $1", id)
        },

        all: () => {
            return rep.any("SELECT * FROM ref_data_source")
        },

        batchFind: (ids, tx = rep) => {
            return tx.any("SELECT * FROM ref_data_source WHERE id IN ($1:csv)", [ids])
        }
    }
}