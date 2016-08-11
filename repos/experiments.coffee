module.exports = (rep, pgp) =>
    gRep:()=> rep
    find: (id) => rep.oneOrNone('SELECT * FROM experiments WHERE id = $1', id)
    all: () => rep.any('SELECT * FROM experiments')

    # TODO fix persist experimentObj
    create: (t, experimentObj) =>
        t.result('insert into experiments( name,status)  values($1,$2)',experimentObj.name, experimentObj.status , (r) ->  r.rowCount)
#        throw validationMessages: ["roll back transaction"]


