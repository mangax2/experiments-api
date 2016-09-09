module.exports = (rep, pgp) => {
    return {
        repository: () => {
            return rep
        },

        find: (id) => {
            return rep.oneOrNone('SELECT * FROM experiments WHERE id = $1', id)
        },

        all: () => {
            return rep.any('SELECT * FROM experiments')
        },

        create: (t, experimentObj) => {
            return t.one("insert into experiments( name,status)  values('" + experimentObj.name + "' , '" + experimentObj.status + "' ) RETURNING id", (id) => { return id })
        },

        update: (t, id, experimentObj) => {
            return t.one("UPDATE experiments SET name='" + experimentObj.name + "', status='" + experimentObj.status + "' WHERE id=" + id + " RETURNING *", (exp) => { return exp})
        },

        delete: (t, id) => {
            return t.one("delete from experiments where id=" + id + " RETURNING id")
        }
    }
}
