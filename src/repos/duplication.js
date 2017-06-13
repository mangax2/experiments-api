module.exports = (rep, pgp) => ({
  repository: () => rep,

  duplicateExperiment: (experimentId, context, tx = rep) => tx.oneOrNone(
    "WITH ins_parent AS (" +
    "INSERT INTO experiment " +
    "SELECT (t1).* FROM (" +
      "SELECT t " +
        "#= hstore('id', nextval(pg_get_serial_sequence('experiment', 'id'))::text) " +
        "#= hstore('created_date', CURRENT_TIMESTAMP::text) " +
        "#= hstore('modified_date', CURRENT_TIMESTAMP::text) " +
        "#= hstore('created_user_id', $2) " +
        "#= hstore('modified_user_id', $2) " +
        "#= hstore('name', CAST(('COPY OF ' || t.name) AS varchar(100))) AS t1 " +
      "FROM experiment t " +
      "WHERE id = $1) sub " +
      "RETURNING id" +
    "), owner_ids AS (" +
    "INSERT INTO owner " +
    "SELECT (c).* " +
      "FROM  (" +
        "SELECT ct " +
          "#= hstore('id', nextval(pg_get_serial_sequence('owner', 'id'))::text) " +
          "#= hstore('user_ids', " +
          "CASE WHEN ct.user_ids @> ARRAY[$2]::varchar[] THEN " +
          "ct.user_ids::text " +
          "ELSE " +
          "array_cat(ct.user_ids, ARRAY[$2]::varchar[])::text " +
          "END) " +
          "#= hstore('created_date', CURRENT_TIMESTAMP::text) " +
          "#= hstore('modified_date', CURRENT_TIMESTAMP::text) " +
          "#= hstore('created_user_id', $2) " +
          "#= hstore('modified_user_id', $2) " +
          "#= hstore('experiment_id', (SELECT id::text FROM ins_parent)) AS c " +
        "FROM owner ct " +
        "WHERE experiment_id = $1 ) sub " +
      "RETURNING id) " +
    "SELECT * FROM ins_parent;",
    [experimentId, context.userId],
  ),
})
