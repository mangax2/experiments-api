module.exports = rep => ({
  repository: () => rep,

  find: (id, tx = rep) => tx.oneOrNone('SELECT * FROM experiment_summary WHERE id = $1', id),

  all: () => rep.any('SELECT * FROM experiment_summary'),
})
