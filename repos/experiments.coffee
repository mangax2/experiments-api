module.exports = (rep, pgp) =>
    repository:()=> rep

    find: (id) => rep.oneOrNone('SELECT * FROM experiments WHERE id = $1', id)

    all: () => rep.any('SELECT * FROM experiments')

    create: (t, experimentObj) =>
        t.one("insert into experiments( name,status)  values('#{ experimentObj.name }' , '#{ experimentObj.status }' ) RETURNING id" , (id) ->  id)

    update: (t, id, experimentObj) =>
        t.one("UPDATE experiments SET name='#{experimentObj.name}', status='#{experimentObj.status}' WHERE id=#{id} RETURNING *", (exp) -> exp)

    delete: (t, id) =>
        t.one("delete from experiments where id=#{id} RETURNING id")