module.exports = (rep, pgp) =>
    find: (id) => rep.oneOrNone('SELECT * FROM experiments WHERE id = $1', id)
    all: () => rep.any('SELECT * FROM experiments')