module.exports = (rep, pgp) =>
    repository:()=> rep

    find: (id) => rep.oneOrNone('SELECT * FROM experiments WHERE id = $1', id)

    all: () => rep.any('SELECT * FROM experiments')

    create: (t, experimentObj) =>
        t.one("insert into experiments( name,status)  values('#{ experimentObj.name }' , '#{ experimentObj.status }' ) RETURNING id" , (exp) ->  exp)

    delete: (t, id) =>
        t.one("delete from experiments where id=#{id} RETURNING id")