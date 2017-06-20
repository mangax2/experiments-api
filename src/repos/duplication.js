module.exports = (rep, pgp) => ({
  repository: () => rep,

  duplicateExperiment: (experimentId, context, tx = rep) => tx.oneOrNone(
    "WITH experiment_parent AS (" +
      "INSERT INTO experiment " +
      "SELECT (e1).* FROM (" +
        "SELECT e " +
          "#= hstore('id', nextval(pg_get_serial_sequence('experiment', 'id'))::text) " +
          "#= hstore('created_date', CURRENT_TIMESTAMP::text) " +
          "#= hstore('modified_date', CURRENT_TIMESTAMP::text) " +
          "#= hstore('created_user_id', $2) " +
          "#= hstore('modified_user_id', $2) " +
          "#= hstore('name', CAST(('COPY OF ' || e.name) AS varchar(100))) AS e1 " +
        "FROM experiment e " +
        "WHERE id = $1) sub " +
        "RETURNING id" +
    "), owner_ids AS (" +
      "INSERT INTO owner " +
      "SELECT (c).* " +
        "FROM  (" +
          "SELECT o " +
            "#= hstore('id', nextval(pg_get_serial_sequence('owner', 'id'))::text) " +
            "#= hstore('user_ids', " +
            "CASE WHEN o.user_ids @> ARRAY[$2]::varchar[] THEN " +
              "o.user_ids::text " +
            "ELSE " +
              "array_cat(o.user_ids, ARRAY[$2]::varchar[])::text " +
            "END) " +
            "#= hstore('created_date', CURRENT_TIMESTAMP::text) " +
            "#= hstore('modified_date', CURRENT_TIMESTAMP::text) " +
            "#= hstore('created_user_id', $2) " +
            "#= hstore('modified_user_id', $2) " +
            "#= hstore('experiment_id', (SELECT id::text FROM experiment_parent)) AS c " +
          "FROM owner o " +
          "WHERE experiment_id = $1 ) sub " +
        "RETURNING id " +
    "), new_factors AS (" +
    "INSERT INTO factor " +
    "SELECT (c).* " +
      "FROM  (" +
        "SELECT f " +
          "#= hstore('id', nextval(pg_get_serial_sequence('factor', 'id'))::text) " +
          "#= hstore('created_date', CURRENT_TIMESTAMP::text) " +
          "#= hstore('modified_date', CURRENT_TIMESTAMP::text) " +
          "#= hstore('created_user_id', $2) " +
          "#= hstore('modified_user_id', $2) " +
          "#= hstore('experiment_id', (SELECT id::text FROM experiment_parent)) AS c " +
        "FROM factor f " +
        "WHERE experiment_id = $1 ) sub " +
      "RETURNING id, name" +
    "), mapped_factor_ids AS (" +
      "SELECT f.id AS old_id, n.id AS new_id " +
      "FROM factor f " +
        "INNER JOIN new_factors n ON f.name = n.name " +
      "WHERE f.experiment_id = $1" +
    "), factor_level_ids AS (" +
    "INSERT INTO factor_level " +
    "SELECT (c).* " +
      "FROM  (" +
        "SELECT fl " +
          "#= hstore('id', nextval(pg_get_serial_sequence('factor_level', 'id'))::text) " +
          "#= hstore('created_date', CURRENT_TIMESTAMP::text) " +
          "#= hstore('modified_date', CURRENT_TIMESTAMP::text) " +
          "#= hstore('created_user_id', $2) " +
          "#= hstore('modified_user_id', $2) " +
          "#= hstore('factor_id', mfi.new_id::text) AS c " +
        "FROM factor_level fl " +
          "INNER JOIN mapped_factor_ids mfi ON fl.factor_id = mfi.old_id ) sub " +
      "RETURNING id" +
    "), dependent_variable_ids AS (" +
    "INSERT INTO dependent_variable " +
    "SELECT (c).* " +
      "FROM  (" +
        "SELECT dv " +
          "#= hstore('id', nextval(pg_get_serial_sequence('dependent_variable', 'id'))::text) " +
          "#= hstore('created_date', CURRENT_TIMESTAMP::text) " +
          "#= hstore('modified_date', CURRENT_TIMESTAMP::text) " +
          "#= hstore('created_user_id', $2) " +
          "#= hstore('modified_user_id', $2) " +
          "#= hstore('experiment_id', (SELECT id::text FROM experiment_parent)) AS c " +
        "FROM dependent_variable dv " +
        "WHERE experiment_id = $1 ) sub " +
      "RETURNING id" +
    ") " +
    "SELECT * FROM experiment_parent;",
    [experimentId, context.userId],
  ),
})
