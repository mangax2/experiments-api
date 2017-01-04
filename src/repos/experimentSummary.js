module.exports = (rep, pgp) => {
    return {
        repository: () => {
            return rep
        },

        find: (id) => {
            return rep.oneOrNone("SELECT * FROM experiment_summary WHERE id = $1", id)
        },

        all: () => {
            return rep.any("SELECT * FROM experiment_summary")
        }
    }
}