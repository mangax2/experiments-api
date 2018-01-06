import _ from 'lodash'

module.exports = rep => ({
  repository: () => rep,

  find: id => rep.oneOrNone('SELECT * FROM ref_group_type WHERE id = $1', id),

  all: () => rep.any('SELECT * FROM ref_group_type'),

  batchFind: (ids, tx = rep) => {
    return tx.any('SELECT * FROM ref_group_type WHERE id IN ($1:csv)', [ids]).then(results => {
      return _.map(ids, id => _.find(results, result => result.id === id))
    })
  },
})
