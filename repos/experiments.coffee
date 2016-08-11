module.exports = (rep, pgp) =>
    repository:()=> rep
    find: (id) => rep.oneOrNone('SELECT * FROM experiments WHERE id = $1', id)
    all: () => rep.any('SELECT * FROM experiments')

    # TODO fix persist experimentObj
    create: (t, experimentObj) =>
        t.one("insert into experiments( name,status)  values('#{ experimentObj.name }' , '#{ experimentObj.status }' ) RETURNING id" , (exp) ->  exp)
#        throw validationMessages: ["roll back transaction"]


