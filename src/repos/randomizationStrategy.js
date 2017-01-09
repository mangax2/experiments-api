module.exports = (rep, pgp) => {
    return {
        repository: () => {
            return rep
        },

        find: (id) => {
            return rep.oneOrNone("SELECT * FROM ref_randomization_strategy WHERE id = $1", id)
        },

        all: () => {
            return rep.any("SELECT * FROM ref_randomization_strategy")
        }
    }
}