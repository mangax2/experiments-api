const pgPromise = require('pg-promise')
const configurator = require('./src/config/configurator')

let pgp

const getFactorLevelLines = (factorLevelValue) => {
  if (factorLevelValue.items[0].items) {
    return factorLevelValue.items.map(row => row.items)
  }
  return [factorLevelValue.items]
}

const createFactorProperties = async (factorProperties, tx) => {
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
  await tx.query(query1)
  return tx.any(query2)
}

const createFactorLevelDetails = async (factorLevelDetails, tx) => {
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
  await tx.query(query1)
  return tx.any(query2)
}

const doPropertyMigration = async db =>
  db.tx('propertyMigration', async (tx) => {
    const experiments = await tx.any('SELECT DISTINCT e.id FROM experiment e INNER JOIN factor f ON e.id = f.experiment_id LEFT JOIN factor_properties_for_level fpfl ON f.id = fpfl.factor_id WHERE fpfl.id IS NULL LIMIT 10')
    if (experiments && experiments.length) {
      const experimentIds = experiments.map(e => e.id)
      console.info('migrating experiment ids', experimentIds)
      const factorLevels = await tx.any('SELECT fl.factor_id, value FROM factor f INNER JOIN (SELECT factor_id, MIN(id) as factor_level_id FROM factor_level GROUP BY factor_id) AS joiner ON f.id = joiner.factor_id INNER JOIN factor_level fl ON joiner.factor_level_id = fl.id WHERE f.experiment_id in ($1:csv)', [experimentIds])
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
      await createFactorProperties(factorProperties, tx)
      return experimentIds.length
    }
    return 0
  })

// eslint-disable-next-line no-unused-vars
const doLevelMigration = async db =>
  db.tx('propertyMigration', async (tx) => {
    const experiments = await tx.any('SELECT DISTINCT e.id FROM experiment e INNER JOIN factor f ON e.id = f.experiment_id INNER JOIN factor_level fl ON f.id = fl.factor_id LEFT JOIN factor_level_details fld ON fl.id = fld.factor_level_id WHERE fld.id IS NULL LIMIT 10')
    if (experiments && experiments.length) {
      const experimentIds = experiments.map(e => e.id)
      console.info('migrating experiment ids', experimentIds)
      const factorLevels = await tx.any('SELECT fl.id, factor_id, value FROM factor f INNER JOIN factor_level fl ON f.id = fl.factor_id WHERE f.experiment_id in ($1:csv)', [experimentIds])
      const factorProperties = await tx.any('SELECT factor_id, label, fpfl.id FROM factor f INNER JOIN factor_properties_for_level fpfl ON f.id = fpfl.factor_id WHERE experiment_id in ($1:csv)', [experimentIds])
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
            factorPropertiesForLevelId: factorPropertyMap[factorLevel.factor_id][detail.label],
            questionCode: detail.multiQuestionTag ? detail.questionCode : undefined,
            rowNumber: index + 1,
          })))
      })
      await createFactorLevelDetails(factorLevelDetails, tx)
      return experimentIds.length
    }
    return 0
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

    return pgp(dbConfig)
  })

console.info(`
By default, this code will create factor properties for every experiment in the database that does not have them yet.
Creating these properties must be done before creating the level details.
To switch to creating level details instead, search for and swap the "const migrationFunction" lines and then rerun the script.
`)
createDbInstance()
  .then(async (db) => {
    // This is where you switch whether you migrate properties or level details:
    const migrationFunction = doPropertyMigration
    // const migrationFunction = doLevelMigration
    let migratedExperimentsCount = 1
    let totalExperimentsMigrated = 0

    try {
      while (migratedExperimentsCount > 0) {
        // eslint-disable-next-line no-await-in-loop
        migratedExperimentsCount = await migrationFunction(db)
        totalExperimentsMigrated += migratedExperimentsCount
      }
      console.info('Migration completed successfully.')
      console.info(`A total of ${totalExperimentsMigrated} experiments where migrated successfully.`)
      process.exit(0)
    } catch (err) {
      console.error('An error occurred during migration: ')
      console.error(err)
      console.info(`A total of ${totalExperimentsMigrated} experiments where migrated successfully before the error.`)
      process.exit(1)
    }
  })
