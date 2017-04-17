module.exports = rep => ({
  repository: () => rep,

  find: id => rep.oneOrNone('SELECT * FROM ref_group_type WHERE id = $1', id),

  all: () => rep.any('SELECT * FROM ref_group_type'),

  batchFind: (ids, tx = rep) => tx.any('SELECT * FROM ref_group_type WHERE id IN ($1:csv)', [ids]),
})
