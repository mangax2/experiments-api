module.exports = rep => ({
  repository: () => rep,

  find: id => rep.oneOrNone('SELECT * FROM ref_data_source WHERE id = $1', id),

  findByTypeId: id => rep.any('SELECT * FROM ref_data_source WHERE ref_data_source_type_id = $1', id),

  all: () => rep.any('SELECT * FROM ref_data_source'),

  batchFind: (ids, tx = rep) => tx.any('SELECT * FROM ref_data_source WHERE id IN ($1:csv)', [ids]),
})
