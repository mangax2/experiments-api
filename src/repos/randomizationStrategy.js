module.exports = (rep, pgp) => ({
  repository: () => rep,

  find: id => rep.oneOrNone('SELECT * FROM ref_randomization_strategy WHERE id = $1', id),

  all: () => rep.any('SELECT * FROM ref_randomization_strategy'),

  batchFind: (ids, tx = rep) => tx.any('SELECT * FROM ref_randomization_strategy WHERE id IN ($1:csv)', [ids]),
})
