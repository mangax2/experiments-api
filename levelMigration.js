const pgPromise = require('pg-promise')
const configurator = require('./src/config/configurator')

let pgp

const getFactorLevelLines = (factorLevelValue) => {
  if (factorLevelValue.items[0].items) {
    return factorLevelValue.items.map(row => row.items)
  }
  return [factorLevelValue.items]
}

const createFactorProperties = (factorProperties, tx) => {
  const columnSet = new pgp.helpers.ColumnSet(
    [
      'id:raw',
      'factor_id',
      'column_number',
      'object_type',
      'label',
      'question_code',
      'multi_question_tag',
      'catalog_type',
      'created_user_id',
      'created_date:raw',
      'modified_user_id',
      'modified_date:raw',
    ], { table: 'temp_insert_factor_properties_for_level' })
  const values = factorProperties.map(factorPropertiesForLevel => ({
    id: 'nextval(pg_get_serial_sequence(\'factor_properties_for_level\', \'id\'))::integer',
    factor_id: factorPropertiesForLevel.factorId,
    column_number: factorPropertiesForLevel.columnNumber,
    object_type: factorPropertiesForLevel.objectType,
    label: factorPropertiesForLevel.label,
    question_code: factorPropertiesForLevel.questionCode,
    multi_question_tag: factorPropertiesForLevel.multiQuestionTag,
    catalog_type: factorPropertiesForLevel.catalogType,
    created_user_id: 'migration',
    created_date: 'CURRENT_TIMESTAMP',
    modified_user_id: 'migration',
    modified_date: 'CURRENT_TIMESTAMP',
  }))

  const query1 = `DROP TABLE IF EXISTS temp_insert_factor_properties_for_level; CREATE TEMP TABLE temp_insert_factor_properties_for_level AS TABLE factor_properties_for_level WITH NO DATA; ${pgp.helpers.insert(values, columnSet)};`
  const query2 = 'INSERT INTO factor_properties_for_level SELECT * FROM temp_insert_factor_properties_for_level RETURNING id'
  return tx.query(query1)
    .then(() => tx.any(query2))
}

const createFactorLevelDetails = (factorLevelDetails, tx) => {
  const columnSet = new pgp.helpers.ColumnSet(
    [
      'id:raw',
      'factor_level_id',
      'factor_properties_for_level_id',
      'row_number',
      'value_type',
      'text',
      'value',
      'question_code',
      'uom_code',
      'created_user_id',
      'created_date:raw',
      'modified_user_id',
      'modified_date:raw',
    ], { table: 'temp_insert_factor_level_details' })
  const values = factorLevelDetails.map(factorLevelDetail => ({
    id: 'nextval(pg_get_serial_sequence(\'factor_level_details\', \'id\'))::integer',
    factor_level_id: factorLevelDetail.factorLevelId,
    factor_properties_for_level_id: factorLevelDetail.factorPropertiesForLevelId,
    row_number: factorLevelDetail.rowNumber,
    value_type: factorLevelDetail.valueType,
    text: factorLevelDetail.text,
    value: factorLevelDetail.value,
    question_code: factorLevelDetail.questionCode,
    uom_code: factorLevelDetail.uomCode,
    created_user_id: 'migration',
    created_date: 'CURRENT_TIMESTAMP',
    modified_user_id: 'migration',
    modified_date: 'CURRENT_TIMESTAMP',
  }))

  const query1 = `DROP TABLE IF EXISTS temp_insert_factor_level_details; CREATE TEMP TABLE temp_insert_factor_level_details AS TABLE factor_level_details WITH NO DATA; ${pgp.helpers.insert(values, columnSet)};`
  const query2 = 'INSERT INTO factor_level_details SELECT * FROM temp_insert_factor_level_details RETURNING id'
  return tx.query(query1)
    .then(() => tx.any(query2))
}

const doPropertyMigration = db =>
  db.tx('propertyMigration', tx =>
    tx.any('SELECT DISTINCT e.id FROM experiment e INNER JOIN factor f ON e.id = f.experiment_id LEFT JOIN factor_properties_for_level fpfl ON f.id = fpfl.factor_id WHERE fpfl.id IS NULL LIMIT 10')
      .then((experiments) => {
        if (experiments && experiments.length) {
          const experimentIds = experiments.map(e => e.id)
          console.info('migrating experiment ids', experimentIds)
          return tx.any('SELECT fl.factor_id, value FROM factor f INNER JOIN (SELECT factor_id, MIN(id) as factor_level_id FROM factor_level GROUP BY factor_id) AS joiner ON f.id = joiner.factor_id INNER JOIN factor_level fl ON joiner.factor_level_id = fl.id WHERE f.experiment_id in ($1:csv)', [experimentIds])
            .then((factorLevels) => {
              const factorProperties = factorLevels.flatMap((factorLevel) => {
                const factorLevelLines = getFactorLevelLines(factorLevel.value)[0]
                return factorLevelLines
                  .map((detail, index) => ({
                    ...detail,
                    factorId: factorLevel.factor_id,
                    questionCode: detail.multiQuestionTag ? undefined : detail.questionCode,
                    columnNumber: index + 1,
                  }))
              })
              return createFactorProperties(factorProperties, tx)
            })
            .then(() => experimentIds.length)
        }
        return 0
      }))
    .then((numberRowsMigrated) => {
      if (numberRowsMigrated > 0) {
        doPropertyMigration(db)
      }
    })

const doLevelMigration = db =>
  db.tx('propertyMigration', tx =>
    tx.any('SELECT DISTINCT e.id FROM experiment e INNER JOIN factor f ON e.id = f.experiment_id INNER JOIN factor_level fl ON f.id = fl.factor_id LEFT JOIN factor_level_details fld ON fl.id = fld.factor_level_id WHERE fld.id IS NULL LIMIT 10')
      .then((experiments) => {
        if (experiments && experiments.length) {
          const experimentIds = experiments.map(e => e.id)
          console.info('migrating experiment ids', experimentIds)
          return Promise.all([
            tx.any('SELECT fl.id, factor_id, value FROM factor f INNER JOIN factor_level fl ON f.id = fl.factor_id WHERE f.experiment_id in ($1:csv)', [experimentIds]),
            tx.any('SELECT factor_id, label, fpfl.id FROM factor f INNER JOIN factor_properties_for_level fpfl ON f.id = fpfl.factor_id WHERE experiment_id in ($1:csv)', [experimentIds]),
          ]).then(([factorLevels, factorProperties]) => {
            // do migration
            const factorPropertyMap = factorProperties.reduce((map, factorProperty) => {
              if (!map[factorProperty.factor_id]) {
                map[factorProperty.factor_id] = {}
              }
              map[factorProperty.factor_id][factorProperty.label] = factorProperty.id
              return map
            }, {})
            const factorLevelDetails = factorLevels.flatMap((factorLevel) => {
              const factorLevelLines = getFactorLevelLines(factorLevel.value)
              return factorLevelLines.flatMap((factorLevelLine, index) =>
                factorLevelLine.map(detail => ({
                  ...detail,
                  factorLevelId: factorLevel.id,
                  factorPropertiesForLevelId:
                    factorPropertyMap[factorLevel.factor_id][detail.label],
                  questionCode: detail.multiQuestionTag ? detail.questionCode : undefined,
                  rowNumber: index + 1,
                })))
            })
            return createFactorLevelDetails(factorLevelDetails, tx)
          })
            .then(() => experimentIds.length)
        }
        return 0
      }))
    .then((numberRowsMigrated) => {
      if (numberRowsMigrated > 0) {
        doLevelMigration(db)
      }
    })

const createDbInstance = () =>
  configurator.init().then((config) => {
    const dbConfig = {
      type: 'conn',
      application_name: `experiments-api-${config.node_env}`,
    }
    dbConfig.host = configurator.get('databaseHost')
    dbConfig.port = configurator.get('databasePort')
    dbConfig.database = configurator.get('databaseName')
    dbConfig.min = configurator.get('databaseMin')
    dbConfig.max = configurator.get('databaseMax')
    dbConfig.idleTimeoutMillis = configurator.get('databaseIdleTimeout')
    dbConfig.ssl = { ca: Buffer.from(configurator.get('databaseCa'), 'base64').toString() }
    dbConfig.user = configurator.get('databaseAppUser')
    dbConfig.password = configurator.get('databaseAppUserPassword')

    pgp = pgPromise()

    // Create the database instance with extensions:
    return pgp(dbConfig)
  })

createDbInstance()
  .then(db => doPropertyMigration(db))
  .then(() => {
    console.info('Migration completed successfully.')
    process.exit(0)
  })
  .catch((err) => {
    console.error('An error occurred during migration: ')
    console.error(err)
    process.exit(1)
  })
