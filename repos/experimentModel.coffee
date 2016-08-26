module.exports = (rep, pgp) =>
  repository:()=> rep

  find: (id) => rep.oneOrNone('SELECT * FROM experiment_model WHERE id = $1', id)

  all: () => rep.any('SELECT * FROM experiment_model')

  create: (t, experimentObj) =>
    t.one("insert into experiment_model( name,status)  values('#{ experimentObj.name }' , '#{ experimentObj.status }' ) RETURNING id" , (id) ->  id)

