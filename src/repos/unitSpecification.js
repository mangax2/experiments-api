module.exports = rep => ({
  repository: () => rep,

  find: id => rep.oneOrNone('SELECT * FROM ref_unit_spec WHERE id = $1', id),

  all: () => rep.any('SELECT * FROM ref_unit_spec'),

  batchFind: (ids, tx = rep) => tx.any('SELECT * FROM ref_unit_spec WHERE id IN ($1:csv)', [ids]),
})
