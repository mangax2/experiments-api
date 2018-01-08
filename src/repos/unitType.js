import _ from "lodash"

module.exports = rep => ({
  repository: () => rep,

  find: id => rep.oneOrNone('SELECT * FROM ref_unit_type WHERE id = $1', id),

  all: () => rep.any('SELECT * FROM ref_unit_type'),

  batchFind: (ids, tx = rep) => tx.any('SELECT * FROM ref_unit_type WHERE id IN ($1:csv)', [ids])
    .then(data => _.map(ids, id => _.filter(data, row => row.id === id))),
})
